// Genera le maschere SVG del bordo di carta strappata (components/carta/Strappo).
// Deterministico (seed fisso): rilanciarlo produce sempre gli stessi file.
// Uso: node scripts/genera-strappo.mjs
import { writeFileSync } from "node:fs";

const W = 3200; // larga: con mask-size "cover" i denti hanno la stessa misura su ogni schermo
const H = 64;
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Profilo dello strappo: onde lunghe + denti corti + rumore.
const passo = 4;
const profilo = [];
for (let x = 0; x <= W; x += passo) {
  const y =
    36 +
    11 * Math.sin(x / 241 + 1.3) +
    6.5 * Math.sin(x / 83 + 0.4) +
    3 * Math.sin(x / 23 + 2.1) +
    (rand() - 0.5) * 4.5;
  profilo.push([x, y]);
}

// Il foglio pieno sta sotto il profilo; le fibre sporgono qualche px sopra.
const tracciato = (dy, extra) =>
  `M0,${H + 24} ` +
  profilo
    .map(([x, y]) => `L${x},${(y - dy - rand() * extra).toFixed(1)}`)
    .join(" ") +
  ` L${W},${H + 24} Z`;

const svg = (
  path,
  freq,
  scala,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax slice">
<filter id="r" x="0" y="-20%" width="100%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="${scala}" xChannelSelector="R" yChannelSelector="G"/></filter>
<path d="${path}" fill="#000" filter="url(#r)"/>
</svg>
`;

const out = "public/images/carta/";
writeFileSync(out + "strappo-bordo.svg", svg(tracciato(0, 0.8), "0.06", 6));
writeFileSync(out + "strappo-fibre.svg", svg(tracciato(5, 4), "0.4", 9));
console.log("ok: strappo-bordo.svg, strappo-fibre.svg");
