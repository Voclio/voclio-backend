/**
 * Rule-based personalized insights when AI is unavailable or returns nothing.
 */
export function buildPersonalizedInsights(userData, language = 'en') {
  const analysis = userData.tasks_analysis || {};
  const stress = userData.stress_indicators || {};
  const patterns = userData.productivity_patterns || {};
  const en = language === 'en' || language === 'english';

  const totalTasks = analysis.total_tasks ?? 0;
  const pending = analysis.pending_tasks ?? 0;
  const overdue = analysis.overdue_tasks ?? 0;
  const completion = analysis.completion_rate ?? 0;
  const highPriority = stress.high_priority_pending ?? 0;
  const noDueDate = stress.tasks_without_due_date ?? 0;
  const focusSessions = patterns.focus_sessions_count ?? 0;
  const streak = userData.summary?.current_streak ?? 0;

  const texts = [];

  if (overdue > 0) {
    texts.push(
      en
        ? `You have ${overdue} overdue task${overdue > 1 ? 's' : ''}. Start with the most urgent one, then reschedule the rest for realistic times today.`
        : `عندك ${overdue} مهمة متأخرة. ابدأ بالأهم واعد جدولة الباقي لأوقات واقعية النهاردة.`
    );
  }

  if (highPriority > 0) {
    texts.push(
      en
        ? `${highPriority} high-priority task${highPriority > 1 ? 's are' : ' is'} still open. Block 30 focused minutes to move ${highPriority > 1 ? 'them' : 'it'} forward.`
        : `فيه ${highPriority} مهمة عالية الأولوية لسه مفتوحة. خصّص 30 دقيقة تركيز لإنجازها.`
    );
  }

  if (totalTasks === 0) {
    texts.push(
      en
        ? 'Record your first task by voice or tap the mic — Voclio will organize it on your calendar automatically.'
        : 'سجّل أول مهمة بالصوت أو اضغط على الميك — Voclio هينظمها في التقويم تلقائياً.'
    );
  } else if (pending > 0 && overdue === 0) {
    texts.push(
      en
        ? `You have ${pending} pending task${pending > 1 ? 's' : ''}. Pick your top 3 and assign each a specific time slot today.`
        : `عندك ${pending} مهمة معلّقة. اختار أهم 3 وحدّد لكل واحدة وقت محدد النهاردة.`
    );
  }

  if (completion < 50 && totalTasks >= 3) {
    texts.push(
      en
        ? `Your completion rate is ${completion}%. Break large tasks into smaller steps and finish one before starting the next.`
        : `معدل إنجازك ${completion}%. قسّم المهام الكبيرة لخطوات صغيرة وأنهِ واحدة قبل ما تبدأ التالية.`
    );
  }

  if (noDueDate > 0) {
    texts.push(
      en
        ? `${noDueDate} task${noDueDate > 1 ? 's have' : ' has'} no due date. Add deadlines so reminders and your calendar stay accurate.`
        : `${noDueDate} مهمة من غير موعد نهائي. ضيف تواريخ استحقاق عشان التذكيرات والتقويم يفضلوا دقيقين.`
    );
  }

  if (focusSessions === 0 && pending > 0) {
    texts.push(
      en
        ? 'Try a 25-minute focus session today — users who time-block tasks complete more of them the same day.'
        : 'جرب جلسة تركيز 25 دقيقة النهاردة — ترتيب المهام بوقت محدد بيزود الإنجاز في نفس اليوم.'
    );
  }

  if (streak >= 3) {
    texts.push(
      en
        ? `Nice ${streak}-day streak! Keep it going by completing one small task before noon.`
        : `ممتاز! عندك ${streak} أيام متتالية. حافظ على الستريك بإنجاز مهمة صغيرة قبل الظهر.`
    );
  }

  if (texts.length === 0) {
    texts.push(
      en
        ? 'You are on track. Review tomorrow\'s calendar tonight and voice-capture anything new while it is fresh.'
        : 'ماشي كويس. راجع تقويم بكرة بالليل وسجّل أي مهام جديدة بالصوت وهي لسه في بالك.'
    );
  }

  return texts.map((text, index) => ({
    suggestion: text,
    category: 'personalized',
    priority: index === 0 ? 'high' : 'medium',
    estimated_impact: 'medium',
    implementation_time: 'daily',
    steps: [],
    source: 'rules'
  }));
}

/**
 * Pick one insight for the day so the home card rotates without feeling random on every refresh.
 */
export function pickDailyInsight(suggestions, userId, date = new Date()) {
  if (!suggestions?.length) return null;
  const dayKey = date.toISOString().split('T')[0];
  const seed = `${userId}:${dayKey}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return suggestions[hash % suggestions.length];
}
