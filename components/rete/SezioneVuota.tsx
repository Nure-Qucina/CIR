/** Stato vuoto di una sezione de «La rete» finché la redazione non pubblica schede. */
export function SezioneVuota({
  titolo,
  testo,
}: {
  titolo: string;
  testo: string;
}) {
  return (
    <div className="foglio flex max-w-2xl flex-col gap-2 px-6 py-8">
      <h2 className="text-ink text-xl font-extrabold">{titolo}</h2>
      <p className="text-ink-soft leading-relaxed">{testo}</p>
    </div>
  );
}
