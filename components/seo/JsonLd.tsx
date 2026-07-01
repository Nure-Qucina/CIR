/**
 * Inietta uno o più blocchi JSON-LD (schema.org) come <script type="application/ld+json">.
 * Server Component: nessun JS lato client.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Il contenuto è generato dal nostro codice, non da input utente.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
