export default function ActionCards() {
  return (
    <iframe
      src={`${import.meta.env.BASE_URL}action-cards/index.html`}
      title="Action Cards"
      style={{ width: "100vw", height: "100vh", border: 0, display: "block" }}
    />
  );
}
