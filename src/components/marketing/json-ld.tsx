// Next's own documented pattern for JSON-LD: next/script can't be used
// here since it strips the non-JS `type` attribute this needs. Plain
// Server Component, no "use client" -- it only ever renders server-computed
// data into a static <script> tag.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
