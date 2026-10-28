import { Link } from "preact-router";
import styled from "styled-components";
import { History, KeyRound, PenLine, Shield } from "lucide-preact";

const steps = [
  {
    title: "Set up your profile",
    text: "Add your name and links, then save a ChatGPT or Claude key.",
    href: "/settings",
  },
  {
    title: "Write from a job post",
    text: "Paste the description, pick a model, and generate a draft.",
    href: "/proposal",
  },
  {
    title: "Keep the record",
    text: "Reopen past bids from History, including ones that failed.",
    href: "/history",
  },
];

const points = [
  {
    icon: <PenLine size={18} />,
    title: "Drafts you can edit",
    text: "Each proposal uses your profile, a word target, and any prompt prefix or suffix you set.",
  },
  {
    icon: <KeyRound size={18} />,
    title: "Your choice of model",
    text: "Generate with ChatGPT or Claude. You can save a prompt without a key and run it later.",
  },
  {
    icon: <History size={18} />,
    title: "A record of every bid",
    text: "History keeps generated drafts, prompt-only saves, and failed attempts in one list.",
  },
  {
    icon: <Shield size={18} />,
    title: "A backup when you need it",
    text: "Export proposals, settings, and analytics, then bring them back on another browser.",
  },
];

const About = ({ className }) => {
  return (
    <div className={className}>
      <header className="page-header">
        <p>
          BidBuddy is a workspace for writing freelance proposals. Paste a job
          post, choose a model, and keep the draft with the rest of your bids.
        </p>
      </header>

      <section className="panel">
        <h2>How it works</h2>
        <ol className="steps">
          {steps.map((step, index) => (
            <li key={step.href}>
              <Link href={step.href}>
                <span className="step-index">{index + 1}</span>
                <span>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>What you can do</h2>
        <ul className="points">
          {points.map((point) => (
            <li key={point.title}>
              <span className="point-icon">{point.icon}</span>
              <span>
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Where your data lives</h2>
        <p>
          Proposals, settings, and API keys stay in this browser. A key is sent
          only when you generate, and only to the provider you selected.
        </p>
      </section>
    </div>
  );
};

export default styled(About)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;

  &,
  & * {
    box-sizing: border-box;
  }

  .page-header p,
  .panel > p {
    margin: 0;
    max-width: 40rem;
    color: #667085;
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }
  }

  .steps,
  .points {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .steps a,
  .points li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
  }

  .steps a {
    color: inherit;
    text-decoration: none;

    &:hover {
      background: #f7fafd;
    }
  }

  .step-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 999px;
    background: rgba(98, 150, 211, 0.14);
    color: #3969a0;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .point-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 10px;
    background: #f7fafd;
    color: #3969a0;
  }

  strong {
    display: block;
    color: #1c1c1c;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .steps span span,
  .points li span span {
    display: block;
    margin-top: 4px;
    color: #667085;
    font-size: 0.92rem;
    line-height: 1.45;
  }
`;
