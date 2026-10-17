// Sauna Math: quiz and calculator. No dependencies.

// Where quiz emails go. Empty means the email box stays hidden.
const FORM_ENDPOINT = "";

const SHOPS = {
  sunlighten: { name: "Sunlighten", href: "/go/sunlighten" },
  healing: { name: "Healing Sauna", href: "/go/healing" },
  clearlight: { name: "Clearlight", href: "/go/clearlight" },
  saunakit: { name: "Sauna Kit Company", href: "/go/saunakit" },
  nordica: { name: "Nordica Sauna", href: "/go/nordica" },
  universe: { name: "Universe of Comfort", href: "/go/universe" },
};

const QUESTIONS = [
  { key: "place", q: "Where will the sauna go?", opts: [["in", "Indoors: spare room, basement, garage"], ["out", "Outdoors: yard, patio, deck"]] },
  { key: "people", q: "How many people at once?", opts: [["1", "Just me"], ["2", "Two"], ["3", "Three or more"]] },
  { key: "heat", q: "What kind of heat do you want?", opts: [["ir", "Gentle and dry, 120 to 140°F (infrared)"], ["trad", "Hot, with water on the stones, 160 to 195°F (traditional)"], ["unsure", "Not sure yet"]] },
  { key: "budget", q: "What's your budget, all in?", opts: [["lt3", "Under $3,000"], ["3to6", "$3,000 to $6,000"], ["6to10", "$6,000 to $10,000"], ["gt10", "Over $10,000"]] },
  { key: "power", q: "What power can you give it?", opts: [["120", "A normal wall outlet only"], ["240", "I can add a 240V circuit (electrician, often $300 to $1,500)"]] },
];

function recommend(a) {
  const infrared = a.heat === "ir" || (a.heat === "unsure" && (a.power === "120" || a.place === "in"));
  const small = a.people !== "3";
  if (infrared) {
    const plugIn = a.power === "120" && small;
    return {
      title: plugIn ? (a.people === "1" ? "1-person infrared that plugs into a normal outlet" : "2-person infrared on a 120V circuit")
                    : (small ? "2-person full-spectrum infrared" : "3 to 4 person infrared on a 240V circuit"),
      why: [
        plugIn ? "Skips the electrician: look for 120V, about 1.5 to 1.8 kW, and a 15 or 20 amp plug." : "Bigger infrared cabins draw 2.5 to 3.5 kW and usually need 240V.",
        "Infrared costs roughly 20 to 30 cents a session to run at 2026 US power prices.",
        "Look for low-EMF heaters, a warranty of 5 years or more, and real wood (hemlock or cedar).",
      ],
      shops: a.budget === "lt3" ? ["healing", "universe"] : ["sunlighten", "clearlight", "healing"],
      code: true,
    };
  }
  return {
    title: a.place === "out" ? (small ? "2-person outdoor traditional sauna" : "4 to 6 person outdoor barrel or cabin sauna")
                             : (small ? "2-person indoor traditional sauna" : "Indoor traditional sauna for 3 or more"),
    why: [
      "A traditional heater is usually 4.5 to 6 kW and needs a dedicated 240V circuit. Budget for the electrician.",
      "Expect about $1 a session in power, because it preheats for 30 to 45 minutes.",
      a.place === "out" ? "Outdoors, pick thermally modified wood or cedar, and plan a level base (pavers or a slab)." : "Indoors, check ceiling height and ventilation before you order.",
    ],
    shops: a.budget === "lt3" || a.budget === "3to6" ? ["nordica", "universe"] : ["saunakit", "nordica"],
    code: false,
  };
}

function initQuiz() {
  const box = document.getElementById("quiz");
  if (!box) return;
  const answers = {};
  let i = 0;
  const bar = document.querySelector(".progress div");
  const render = () => {
    bar.style.width = `${Math.min(i / QUESTIONS.length, 1) * 100}%`;
    if (i >= QUESTIONS.length) return showResult();
    const q = QUESTIONS[i];
    box.innerHTML = `<p class="note">Question ${i + 1} of ${QUESTIONS.length}</p><h2>${q.q}</h2><div class="opts"></div>`;
    const opts = box.querySelector(".opts");
    q.opts.forEach(([val, label]) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = label;
      b.onclick = () => { answers[q.key] = val; i++; render(); };
      opts.appendChild(b);
    });
  };
  const showResult = () => {
    const r = recommend(answers);
    const shopLinks = r.shops.map((s) => `<a class="btn" style="margin:6px 8px 6px 0" href="${SHOPS[s].href}" rel="sponsored nofollow" target="_blank">See ${SHOPS[s].name} models</a>`).join("");
    box.innerHTML = `
      <span class="tag">Your match</span>
      <h2 style="margin-top:6px">${r.title}</h2>
      <div class="pick"><ul>${r.why.map((w) => `<li>${w}</li>`).join("")}</ul>${shopLinks}</div>
      ${r.code && FORM_ENDPOINT ? `<div class="callout"><b>Get $100 off:</b> leave your email and we'll send our Healing Sauna discount code, plus a price check on any model you're considering.</div>` : ""}
      <div id="lead"></div>
      <p><a href="/calculator/">Run the full cost numbers for your pick →</a></p>`;
    if (FORM_ENDPOINT) {
      document.getElementById("lead").innerHTML = `
        <form id="leadform"><label for="em">Email me the code and a price check</label>
        <input id="em" type="email" name="email" required placeholder="you@example.com">
        <p><button class="btn" type="submit">Send it</button></p></form>`;
      document.getElementById("leadform").onsubmit = async (e) => {
        e.preventDefault();
        const data = { email: e.target.email.value, ...answers, match: r.title };
        try {
          await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          document.getElementById("lead").innerHTML = "<p><b>Sent.</b> Check your inbox in a few minutes.</p>";
        } catch {
          document.getElementById("lead").innerHTML = "<p>That didn't go through. Please try again.</p>";
        }
      };
    }
  };
  render();
}

const money = (n, d = 0) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function initCalc() {
  const f = document.getElementById("calc");
  if (!f) return;
  const out = document.getElementById("calc-out");
  const run = () => {
    const v = (k) => parseFloat(f.elements[k].value) || 0;
    const price = v("price"), install = v("install"), kw = v("kw"), mins = v("mins"), perWeek = v("week"), rate = v("rate") / 100, gym = v("gym");
    const perSession = kw * (mins / 60) * rate;
    const perMonth = perSession * perWeek * 52 / 12;
    const upfront = price + install;
    const sessions5 = perWeek * 52 * 5;
    const per5 = sessions5 ? (upfront + perSession * sessions5) / sessions5 : 0;
    const saving = gym - perMonth;
    const breakeven = saving > 0 ? upfront / saving : Infinity;
    out.innerHTML = `
      <div class="cards">
        <div class="card"><p class="note">Power per session</p><div class="big">${money(perSession, 2)}</div></div>
        <div class="card"><p class="note">Power per month</p><div class="big">${money(perMonth)}</div></div>
        <div class="card"><p class="note">All-in cost per session over 5 years</p><div class="big">${money(per5, 2)}</div></div>
        <div class="card"><p class="note">Pays for itself vs. your membership in</p><div class="big">${isFinite(breakeven) ? (breakeven / 12).toFixed(1) + " yrs" : "never"}</div></div>
      </div>
      <p class="note">Upper-bound estimate: assumes the heater runs flat out the whole time. Real use is usually lower, because heaters cycle once they're up to temperature.</p>`;
  };
  f.addEventListener("input", run);
  run();
}

initQuiz();
initCalc();
