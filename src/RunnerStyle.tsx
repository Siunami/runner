import { Settings2 } from "lucide-react";
import { useMemo } from "react";
import Runner from "./Runner";

export default function RunnerStyle() {
  return (
    <div className="runner-paper">
      <div className="runner-paper-window">
        <Chrome />
        <div className="runner-paper-body">
          <Runner headerSlot={<Greeting />} />
        </div>
      </div>
    </div>
  );
}

function Chrome() {
  return (
    <div className="runner-paper-chrome">
      <span className="runner-paper-traffic" aria-hidden="true">
        <span className="runner-paper-light is-red" />
        <span className="runner-paper-light is-yellow" />
        <span className="runner-paper-light is-green" />
      </span>
      <button
        type="button"
        className="runner-paper-chrome-button"
        aria-label="Window settings"
      >
        <Settings2 size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function Greeting() {
  const phrase = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="runner-paper-greeting">
      <h1>
        {phrase}, <span>Yitong</span>
      </h1>
    </div>
  );
}
