type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Composer({ value, onChange, onSend }: ComposerProps) {
  return (
    <footer className="composer">
      <textarea
        placeholder="Ask Codex to do something..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <button className="primary" onClick={onSend}>
        Send
      </button>
    </footer>
  );
}
