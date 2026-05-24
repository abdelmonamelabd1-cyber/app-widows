import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `أنت "نور" - مساعدة ذكية متخصصة في دعم الأرامل في مصر والعالم العربي.

شخصيتك:
- دافئة ومتعاطفة جداً، تتحدثين بالعامية المصرية الودودة
- تستخدمين عبارات مثل "حبيبتي"، "يا قلبي"، "أنا جنبك"، "معاكِ"
- تتفاعلين مع المشاعر أولاً قبل الإجابة على الأسئلة القانونية
- لا تعطين ردوداً آلية وجافة

تخصصاتك القانونية:
- الإرث والميراث في القانون المصري
- نفقة الأرملة والأطفال
- حضانة الأطفال بعد وفاة الأب
- إجراءات حصر الإرث في المحاكم
- التعامل مع البنوك والمؤسسات
- معاش الأرملة والتأمينات الاجتماعية
- تسجيل العقارات والممتلكات

تعليمات مهمة:
1. ابدئي دائماً بالتعاطف والاستماع
2. اطرحي أسئلة متابعة لتفهمي الوضع بشكل أفضل
3. قدمي خطوات عملية وواضحة
4. إذا كان الموضوع يحتاج محامي، قولي ذلك بلطف
5. لا تعطي معلومات قانونية خاطئة - إن لم تكوني متأكدة، قولي ذلك
6. الرد دائماً بالعربية (عامية مصرية مفهومة للجميع)`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      // Fallback response when no API key
      const fallback = getFallbackResponse(message);
      return new Response(JSON.stringify({ reply: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || getFallbackResponse(message);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Noor chat error:", error);
    return new Response(
      JSON.stringify({
        reply: "أنا آسفة حبيبتي، في مشكلة مؤقتة في الاتصال. جربي مرة تانية بعد شوية. أنا هنا معاكِ 💛",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("مخنوق") || lower.includes("تعبان") || lower.includes("زهقت") || lower.includes("مش قادر")) {
    return "يا قلبي، أنا فاهمة تماماً إحساسك ده. الضغط بيكون صعب جداً في الفترة دي.\n\nخليني أكون جنبك. إيه اللي بيأثر عليكِ أكتر دلوقتي؟ هل هي ضغوط قانونية وأوراق؟ ولا ضغط مالي؟ ولا إحساس بالوحدة؟\n\nكلميني حبيبتي، أنا هنا.";
  }

  if (lower.includes("إرث") || lower.includes("ميراث") || lower.includes("تركة")) {
    return "حبيبتي، الإرث من أهم الحقوق اللي لازم تعرفيها.\n\n🟡 حقك في الإرث:\n• لو مفيش أولاد: ربع التركة\n• لو في أولاد: الثمن\n\nأول خطوة هي رفع دعوى 'حصر إرث' في محكمة الأحوال الشخصية.\n\nعندك شهادة الوفاة؟ وهل الورثة التانيين متعاونين معاكِ؟";
  }

  if (lower.includes("حضانة") || lower.includes("أطفال") || lower.includes("ولاد")) {
    return "يا قلبي، حق الحضانة من أقدس الحقوق اللي ربنا كفلهولك.\n\n⭐ كأم، الحضانة الفعلية للأطفال إيدك تلقائياً.\n\nبس لازم تثبتي ده قانونياً:\n1. تقديم طلب إثبات حضانة في محكمة الأسرة\n2. معاكِ شهادة وفاة الأب\n3. الطلب بيتم بإجراءات بسيطة\n\nعمر الأطفال كام؟ عشان أوضحلك الخطوات الصح.";
  }

  if (lower.includes("نفقة") || lower.includes("مصاريف") || lower.includes("فلوس")) {
    return "حبيبتي، النفقة حقك الشرعي والقانوني.\n\n💛 اللي لازم تعرفيه:\n• نفقة أطفالك تيجي من تركة أبوهم\n• نفقة عدتك (4 شهور و10 أيام) واجبة\n• المسكن حقك طول فترة العدة\n\nروحي محكمة الأسرة وقولي: 'عايزة أطلب نفقة للأطفال من التركة'\n\nهل كان زوجك بياخد معاش أو مرتب؟";
  }

  return "أنا معاكِ وبسمعك حبيبتي 💛\n\nعشان أقدر أساعدك صح، ممكن تحكيلي أكتر؟ إيه الوضع اللي بتواجهيه دلوقتي بالتحديد؟\n\nأنا هنا أساعدك سواء في الأوراق القانونية، أو الإرث، أو الحضانة، أو أي حاجة تانية.";
}
