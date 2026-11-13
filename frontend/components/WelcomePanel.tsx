import { ActivityIcon, ArrowRightIcon, BookIcon, HeartIcon, MedicalMark, MoonIcon, PillIcon, ShieldIcon } from "@/components/icons";

type WelcomePanelProps = { onPromptSelect: (prompt: string) => void; disabled: boolean };

const suggestions = [
  { label: "Understand a symptom", prompt: "What are common causes of a recurring headache?", Icon: ActivityIcon },
  { label: "Sleep better", prompt: "What are practical ways to improve my sleep quality?", Icon: MoonIcon },
  { label: "Medication questions", prompt: "What should I ask my doctor about a new medication?", Icon: PillIcon },
  { label: "Heart health", prompt: "Which lifestyle changes help lower blood pressure?", Icon: HeartIcon },
];

export const WelcomePanel = ({ onPromptSelect, disabled }: WelcomePanelProps) => (
  <section className="welcome" aria-labelledby="welcome-title">
    <span className="welcome-mark" aria-hidden="true"><MedicalMark width={26} height={26} /></span>
    <h2 id="welcome-title" className="welcome-title">How can I help you today?</h2>
    <p className="welcome-subtitle">
      Ask a health question and get a clear answer grounded in a curated medical knowledge base.
    </p>

    <div className="suggestions">
      {suggestions.map(({ label, prompt, Icon }) => (
        <button key={label} type="button" className="suggestion" onClick={() => onPromptSelect(prompt)} disabled={disabled}>
          <span className="suggestion-icon"><Icon width={18} height={18} /></span>
          <span className="suggestion-copy">
            <strong>{label}</strong>
            <span>{prompt}</span>
          </span>
          <ArrowRightIcon className="suggestion-arrow" width={16} height={16} />
        </button>
      ))}
    </div>

    <ul className="trust-row" aria-label="About this assistant">
      <li><BookIcon width={15} height={15} /> Answers from reference material</li>
      <li><ShieldIcon width={15} height={15} /> Not a substitute for a doctor</li>
    </ul>
  </section>
);
