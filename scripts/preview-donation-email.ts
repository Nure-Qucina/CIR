import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderDonationThankYouEmail } from "../lib/donazioni/email-render";

const outDir = resolve(process.cwd(), "tmp/donation-email-preview");
mkdirSync(outDir, { recursive: true });

const portal = "https://billing.stripe.com/p/login/test_preview1";

const fixtures = [
  {
    file: "one-time-it.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 0,
      totalCents: 2500,
      locale: "it",
      frequency: "one_time" as const,
    },
  },
  {
    file: "one-time-it-contribution.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 64,
      totalCents: 2564,
      locale: "it",
      frequency: "one_time" as const,
    },
  },
  {
    file: "monthly-it-portal.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 64,
      totalCents: 2564,
      locale: "it",
      frequency: "monthly" as const,
      portalUrl: portal,
    },
  },
  {
    file: "monthly-it-noportal.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 0,
      totalCents: 2500,
      locale: "it",
      frequency: "monthly" as const,
    },
  },
  {
    file: "one-time-en.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 0,
      totalCents: 2500,
      locale: "en",
      frequency: "one_time" as const,
    },
  },
  {
    file: "one-time-ar.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 0,
      totalCents: 2500,
      locale: "ar",
      frequency: "one_time" as const,
    },
  },
  {
    file: "one-time-bn.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 0,
      totalCents: 2500,
      locale: "bn",
      frequency: "one_time" as const,
    },
  },
  {
    file: "monthly-ar-portal.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 64,
      totalCents: 2564,
      locale: "ar",
      frequency: "monthly" as const,
      portalUrl: portal,
    },
  },
  {
    file: "monthly-bn-portal.html",
    input: {
      firstName: "Sara",
      donationCents: 2500,
      contributionCents: 64,
      totalCents: 2564,
      locale: "bn",
      frequency: "monthly" as const,
      portalUrl: portal,
    },
  },
];

for (const fixture of fixtures) {
  const rendered = renderDonationThankYouEmail(fixture.input);
  writeFileSync(resolve(outDir, fixture.file), rendered.html, "utf8");
  writeFileSync(
    resolve(outDir, fixture.file.replace(/\.html$/, ".txt")),
    rendered.text,
    "utf8",
  );
}

console.log(`Wrote preview files to ${outDir}`);
for (const fixture of fixtures) {
  console.log(`- ${fixture.file}`);
}
