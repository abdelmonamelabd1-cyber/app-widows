import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `أنتِ مستشارة قانونية ونفسية متخصصة في مساعدة الأرامل في مصر. اسمك "نور" وبتتكلمي بالمصري بطريقة إنسانية ودافئة، مش زي الروبوت.

قواعد مهمة:
- اتكلمي بالمصري العادي، زي ما حد بيكلّم صاحبته
- كوني دافئة ومتفهمة — الأرملة ممكن تكون بتمر بأوقات صعبة
- لو حد قالتلك حاجة محزنة، ردي بالتعاطف الأول قبل النصيحة (مثلاً: "فاهمتك جداً، وأنا هنا علشانك")
- إدي نصائح قانونية عملية وبسيطة مش مصطلحات قانونية معقدة
- ذكّريها إنها مش لوحدها وإن حقوقها محمية بالقانون

مجالات التخصص:
- الميراث: الزوجة ليها ربع التركة لو مفيش أولاد، والثمن لو فيه أولاد
- النفقة: حق مشروع للأرملة وأطفالها، ترفع دعوى في محكمة الأسرة
- الحضانة: الأم أحق بحضانة أطفالها لحد ما الولد يبقى 15 سنة والبنت لحد ما تتجوز
- حق السكن: الأرملة ليها الحق تسكن في بيت الزوجية فترة العدة
- إجراءات بعد الوفاة: شهادة الوفية، إعلام ورثة، حصر ممتلكات، معاش تأمينات
- المستندات: عقود، إقرارات استلام، تنازلات — لا توقّعي على حاجة من غير ما تقرايها كويس أو تشاوري محامي
- الدعم النفسي: مش عيب تطلبي مساعدة، وكل خطوة صغيرة بتعملها بتعمل فرق

لو السؤال مش في مجالك، قولي بصراحة وأرشديها تتكلم مع محامي متخصص. لو محتاجة دعم نفسي عميق، شجعيها تتواصل مع متخصصة.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { message, history }: { message: string; history?: ChatMessage[] } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load previous messages for context
    const { data: prevMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20);

    const contextMessages: ChatMessage[] = (prevMessages || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add any client-side history too
    if (history && history.length > 0) {
      contextMessages.push(...history);
    }

    // Keep only last 16 messages for context window
    const recentContext = contextMessages.slice(-16);

    // Build messages for the AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentContext,
      { role: "user" as const, content: message },
    ];

    // Call Supabase AI (built-in) or fallback to keyword-based responses
    let aiResponse: string;

    try {
      // Try using Supabase AI inference
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-inference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ messages: aiMessages }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.content || data.message || data.response;
      } else {
        throw new Error("AI inference unavailable");
      }
    } catch {
      // Fallback: intelligent keyword-based response in Egyptian Arabic
      aiResponse = generateResponse(message);
    }

    // Save messages to database
    await supabase.from("chat_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: aiResponse },
    ]);

    return new Response(
      JSON.stringify({ role: "assistant", content: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateResponse(msg: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes("نفقة") || lower.includes("مصاريف") || lower.includes("مصروف")) {
    return "فاهمتك يا حبيبتي. النفقة حقكِ المشروع زي الشمس، ومحدش يقدر ياخده منكِ. لو الزوج أو ورثته مش بيديولكِ النفقة، تقدري ترفعي دعوى نفقة في محكمة الأسرة. المحكمة هتحدد المبلغ على حسب دخته واحتياجاتكِ وأولادكِ. نصيحتي: جمّعي كل فواتير المصاريف بتاعتكِ — إيجار وأكل ومدرسة وعلاج — لأن ده هيساعدكِ في المحكمة. وإنتِ مش لوحديكِ، أنا هنا معاكي كل خطوة 💜";
  }

  if (lower.includes("ميراث") || lower.includes("وراثة") || lower.includes("تركة")) {
    return "الميراث ده حقكِ في الشريعة والقانون. حسب القانون المصري والشريعة الإسلامية، الزوجة بترث ربع التركة لو مفيش أولاد، والثمن لو فيه أولاد. بس لازم تنتبهي إن في ناس كتير بتاخد كمان — الأم والأب والإخوة والأولاد — كل واحد ليه نصيبه. نصيحتي العملي: روحي لمحامي متخصص في الميراث واطلبي حصر الورثة من المحكمة. ده مش حرام ولا عيب — ده حقكِ! وأي حد يقولكِ تنازلي عن حقكِ — لا تسيبيش حاجة من غير ما تفهميها كويس 💜";
  }

  if (lower.includes("حضانة") || lower.includes("أولاد") || lower.includes("اطفال") || lower.includes("بنات") || lower.includes("ولد")) {
    return "يا حبيبتي، الأم هي أحق واحد بحضانة أطفالها — ده القانون والشريعة بيقولوا كده. الحضانة بتفضل معاكي لحد ما الولد يبقى 15 سنة والبنت لحد ما تتجوز. لو حد بيحاول ياخد منكِ الأولاد، ده مش سهل قانونياً إلا لو في سبب قوي جداً. لو في نزاع، رفعي دعوى حضانة في محكمة الأسرة. أهم حاجة: الأولاد محتاجين أمهم، وإنتِ أقوى مم ما تفتكري 💜";
  }

  if (lower.includes("وفاة") || lower.includes("مات") || lower.includes("توفي") || lower.includes("بعد الوفاة") || lower.includes("الوفية")) {
    return "فاهمتك جداً، وأنا عارفة إن الفترة دي أصعب حاجة في الدنيا. بس إنتِ مش لوحديكِ وهنمشي معاكي خطوة بخطوة:\n\n1. استخرجي شهادة الوفاة من السجل المدني — ده أول حاجة ضرورية\n2. اعملي إعلام ورثة في المحكمة\n3. حصّري كل الممتلكات والحسابات البنكية\n4. تقدمي للمعاش من التأمينات الاجتماعية\n5. أبلغي البنوك علشان تحدّثي الحسابات\n\nخدي وقتكِ في الحزن ده مش عيب — بس خدي خطوة كل يوم ولو صغيرة. وأنا هنا لو محتاجة تفاصيل عن أي خطوة 💜";
  }

  if (lower.includes("عقد") || lower.includes("توقيع") || lower.includes("ورقة")) {
    return "لا توقّعي على أي عقد أو ورقة من غير ما تقرايها كويس جداً! خصوصاً لو:\n- التنازل عن حق\n- إقرار استلام مبلغ\n- أي عقد فيه شروط مش فاهماها\n\nنصيحتي: خدي نسخة من الورقة ووريهالي أو لمحامي يقرأها. كتير من الأرامل بيضطهدوا يوقّعوا على حاجات بيفقدوا حقوقهم. إنتِ مش مضغوطة توقّعي على حاجة في نفس اليوم — خدي وقتكِ وفكري كويس 💜";
  }

  if (lower.includes("تنازل")) {
    return "التنازل ده قرار خطير جداً! التنازل عن حقكِ معناه إنكِ متنازلي عنه نهائياً ومحدش هيقدر يرجّعه. لو حد طلب منكِ تتنازلي — خصوصاً عن ميراث أو نفقة أو بيت — لا توقّعي على حاجة من غير ما تشاوري محامي. ولو حاسة بضغط من حد، ده مش صح وقانونياً لو في إكراه يبقى التنازل ممكن يت cancel. إنتِ حقوقكِ غالية — لا تسيبيش حاجة من غير ما تفهميها 💜";
  }

  if (lower.includes("إقرار") || lower.includes("استلام")) {
    return "إقرار الاستلام ده ورقة بتقول إنكِ استلمتي حاجة — غالباً فلوس. قبل ما توقّعي:\n- تأكدي إن المبلغ اللي مكتوب هو اللي استلمتيه فعلاً\n- التاريخ يكون صح\n- لو في أي اختلاف، لا توقّعي\n\nكتير من الأرامل بيطلبوا منهم يوقّعوا إقرار استلام بفلوس أقل من اللي اتدفعتواش. لا تسيبيش حقكِ — خدي وقتكِ واقراية كويس 💜";
  }

  if (lower.includes("محكمة") || lower.includes("قضية") || lower.includes("محامي")) {
    return "لو محتاجة ترفعي قضية أو عندكِ قضية موجودة:\n- محكمة الأسرة: للنفقة والحضانة والخلع\n- محكمة المدنية: للميراث والممتلكات\n- لازم محامي — لا تروحي لوحدكِ\n\nنصيحتي: اختاري محامية متخصصة في قضايا الأسرة لو قدرتي. واسألي عن تكلفة القضية الأول. ولو مش قادرة تتحملي تكلفة المحامي، في مكاتب المساعدة القانونية المجانية في المحاكم 💜";
  }

  if (lower.includes("معاش") || lower.includes("تأمينات") || lower.includes("ضمان")) {
    return "المعاش ده حقكِ من التأمينات الاجتماعية لو الزوج كان بيخصم تأمينات. روحي لأقرب مكتب تأمينات اجتماعية بالشهادات دي:\n- شهادة الوفاة\n- البطاقة الشخصية بتاعتكِ\n- شهادة الزواج\n- قسيمة الزواج\n- أرقام التأمينية للزوج\n\nالمعاش بيبقى جزء من مرتب الزوج وبيستمر مدى الحياة. لا تسيبيش حقكِ ده — ده فلوسكِ وأولادكِ 💜";
  }

  if (lower.includes("سكن") || lower.includes("بيت") || lower.includes("شقة") || lower.includes("إيجار")) {
    return "حقكِ في السكن محمي بالقانون:\n- في فترة العدة (4 شهور و10 أيام): إنتِ قانونياً ليكِ حق تسكني في بيت الزوجية\n- لو البيت إيجار: الإيجار بيكون باسم الزوج بس إنتِ واولادكِ ليكم الحق تكملوا في الشقة\n- لو حد بيحاول يطلّعكِ: ده غير قانوني خليه يروح المحكمة\n\nنصيحتي: لا تخرجي من البيت من غير ما تشاوري محامي — خروجكِ ممكن يأثر على حقوقكِ 💜";
  }

  if (lower.includes("مش عارفة") || lower.includes("مش فاهمة") || lower.includes("إيه أعمل") || lower.includes("محتارة")) {
    return "ولا يهمك يا حبيبتي — مش عيب إنكِ مش عارفة. ده مشروع وكلنا بنحتاج حد يوضّحلنا. قوليلي إيه الموقف اللي واقعة فيه وأنا هحاول أشرّحلك خطوة بخطوة بلغة بسيطة. وإنتِ أقوى مم ما تفتكري — كل يوم بتعدي بتعملي إنجاز ولو صغير 💜";
  }

  if (lower.includes("خايفة") || lower.includes("قلقانة") || lower.includes("توتر") || lower.includes("قلق")) {
    return "فاهمتك جداً. الخوف ده طبيعي جداً — إنتِ بتعدي بفترة صعبة ومحدش اللومكِ. بس تعرفي إيه؟ الخوف مش معناه إنكِ ضعيفة — بالعكس، ده معناه إنكِ بتفكّري وبتحمي نفسكِ وأولادكِ. خدي نفس عميق وحاولي تركزي على خطوة واحدة بس — مش لازم تعملي كل حاجة النهارده. وأنا هنا معاكي، مش هسيبكِ 💜";
  }

  if (lower.includes("حزينة") || lower.includes("زعلانة") || lower.includes("بكاء") || lower.includes("وحيدة") || lower.includes("لوحدي")) {
    return "يا حبيبتي، الحزن ده حقكِ وده طبيعي جداً. فقدان الزوج ده من أصعب الحاجات اللي ممكن حد يمر بيها. إنتِ مش لوحدكِ في الشعور ده — كتير من السيدات عدّوا نفس الطريق. البكاء مش ضعف، ده طريقة الجسم إنه يفرّج عن نفسه. وحاولي:\n- تتكلمي مع حد تثقي فيه — صديقة أو أخت\n- تعملي حاجة بسيطة لنفسكِ كل يوم\n- تتذكّري إن الوقت بيشفي مش بيكمّل\n\nوأنا هنا دايماً لو حابة تتكلمي 💜";
  }

  if (lower.includes("مرسي") || lower.includes("شكرا") || lower.includes("شكراً")) {
    return "العفو يا حبيبتي! إنتِ مش محتاجة تشكري — ده واجبي. أي وقت محتاجة حاجة قوليلي وأنا هنا. فكّري دايماً: إنتِ قوية وإنتِ قادرة تعدي الفترة دي. خطوة بخطوة وهتوصلي 💜";
  }

  // Default empathetic response
  return "فاهمتك يا حبيبتي. أنا هنا علشان أسمعكِ وأساعدكِ. قوليلي أكتر عن الموقف اللي واقعة فيه — هل الموضوع قانوني زي نفقة أو ميراث أو مستندات؟ ولا محتاجة دعم نفسي وتحد تشتكي؟ أي حاجة أنا هنا معاكي مش هسيبكِ 💜";
}
