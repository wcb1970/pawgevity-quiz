import { useState, useEffect, useRef } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const B = {
  // Pawgevity brand — from design system
  plum:   "#5A1E36",  plumM:  "#7A2848",  plumL:  "#F9EFF2",
  gold:   "#B8874F",  goldM:  "#D4A373",  goldL:  "#E6C08A",
  goldXL: "#FBF3E3",
  cream:  "#F6E7D8",  creamL: "#FAF4EE",
  taupe:  "#836953",
  white:  "#FFFFFF",

  // App accent (kept for quiz UI contrast)
  forest: "#0B4D37",  forestM:"#156B4F",  forestL:"#E8F4EF",

  // Olive (paw logo)
  olive:  "#685820",  oliveM: "#8B7A2E",  oliveL: "#F5EFD9",

  // Other pillars
  coral:  "#C0391A",  coralL: "#FAEAE6",
  teal:   "#0B7490",  tealL:  "#E5F6FA",
  purp:   "#5B35A0",  purpL:  "#F0EBFA",

  // Text
  navy:   "#2A0F1B",  text:   "#3D1A28",  sub:    "#836953",  muted:  "#A08070",
  border: "#E8D5C4",

  // Gradients
  goldGrad: "linear-gradient(135deg, #B8874F 0%, #D4A373 50%, #E6C08A 100%)",
  plumGrad: "linear-gradient(145deg, #3D1225 0%, #5A1E36 55%, #7A2848 100%)",

  // Fonts — Pawgevity brand spec
  ff:  "'Playfair Display', serif",   // Headlines
  fn:  "'Inter', sans-serif",          // Body/UI
  fc:  "'Cinzel', serif",              // Badges/accent labels
};

// ─── QUIZ FLOW — modeled on Farmer's Dog / Ollie onboarding ──────────────────
// Frame: "We're building your dog's wellness profile" not "Take a quiz"
// Start personal, go health, end with current routine
// 6 questions max — research shows completion peaks at 5-7

const STEPS = [
  // Step 0 — Name (immediate personalization hook)
  { type:"text", id:"name",
    q: ()=>"What's your dog's name?",
    placeholder:"e.g. Bella, Max, Rudy…",
    sub:"We'll build everything around them.",
    emoji:"🐾",
  },

  // Step 1 — Breed (profile-building feel)
  { type:"choice", id:"breed",
    q: (d)=>`What breed is ${d.name}?`,
    sub:"Select the closest match.",
    emoji:"🐕",
    choices:[
      { label:"Golden / Lab",        icon:"🟡", value:"retriever"  },
      { label:"German Shepherd",     icon:"🐺", value:"shepherd"   },
      { label:"Pit Bull / Bulldog",  icon:"💪", value:"bulldog"    },
      { label:"Small breed (Beagle, Shih Tzu, etc.)", icon:"🐩", value:"small" },
      { label:"Large breed (Rottweiler, Husky, etc.)", icon:"🦮", value:"large" },
      { label:"Mixed breed",         icon:"🐶", value:"mixed"      },
    ]
  },

  // Step 2 — Age (profile + determines pillar focus)
  { type:"choice", id:"age",
    q: (d)=>`How old is ${d.name}?`,
    sub:"Age is one of the most useful pieces of context when thinking about a dog's wellness picture.",
    emoji:"🐾",
    choices:[
      { label:"Under 5 years",  icon:"🌱", value:"young"  },
      { label:"5 – 6 years",   icon:"🌿", value:"mid"    },
      { label:"7 – 8 years",   icon:"🍂", value:"senior1"},
      { label:"9 – 10 years",  icon:"🍁", value:"senior2"},
      { label:"11+ years",     icon:"❄️", value:"senior3"},
    ]
  },

  // Step 3 — Myth-busting health concern (Scratch pattern — surprising + educational)
  { type:"choice", id:"concern",
    q: (d)=>`Where are you most worried about ${d.name} right now?`,
    sub:"There are no wrong answers — just share what feels most present for you right now.",
    emoji:"🔍",
    myth:true,
    choices:[
      { label:"Moving slower or stiffening up",  icon:"🦴", value:"joint",  pillar:"Joint & Mobility"  },
      { label:"Dull coat or skin issues",        icon:"✨", value:"coat",   pillar:"Skin & Coat"       },
      { label:"Digestion or appetite changes",   icon:"🛡️", value:"gut",    pillar:"Gut & Immune"      },
      { label:"Seeming confused or less alert",  icon:"🧠", value:"brain",  pillar:"Brain & Cognitive" },
      { label:"General discomfort or restlessness", icon:"🔥", value:"inflam", pillar:"Inflammation" },
      { label:"Honestly — not sure yet",         icon:"🤔", value:"unsure", pillar:"General Wellness"  },
    ]
  },

  // Step 4 — Current routine (qualification data for Klaviyo + conversation starter)
  { type:"choice", id:"routine",
    q: (d)=>`What are you currently giving ${d.name} for health support?`,
    sub:"No right or wrong answer — this helps us personalize your report.",
    emoji:"💊",
    choices:[
      { label:"Nothing yet — just kibble",                   icon:"🥣", value:"none"      },
      { label:"A joint supplement or fish oil",              icon:"🐟", value:"joint_supp" },
      { label:"A multivitamin or probiotic",                 icon:"🌿", value:"multi"      },
      { label:"Prescription food or vet-recommended diet",   icon:"🏥", value:"rx"         },
      { label:"Several different supplements",               icon:"💊", value:"multi_supp" },
    ]
  },

  // Step 5 — One observable signal (specific, reassures dog owner they know their dog)
  { type:"choice", id:"signal",
    q: (d)=>`In the past month, has ${d.name} shown any of these?`,
    sub:"Choose the one that feels most relevant. Small, gradual changes are often the most worth noticing.",
    emoji:"👀",
    choices:[
      { label:"Slower to get up after resting",              icon:"🐢", value:"mobility"   },
      { label:"Less interested in walks or play",            icon:"😴", value:"energy"     },
      { label:"Coat looking dull or shedding more",          icon:"🪮", value:"coat"       },
      { label:"Picky eating or skipping meals",              icon:"🍽️", value:"appetite"   },
      { label:"Restless sleep or shifting positions often",  icon:"😟", value:"comfort"    },
      { label:"Nothing noticeable — seems the same",         icon:"✅", value:"none"       },
    ]
  },

  // Step 6 — Vet visit (segmentation gold + emotional resonance)
  { type:"choice", id:"vet",
    q: (d)=>`When did ${d.name} last see a vet?`,
    sub:"This gives us a little more context about where things stand with your dog's care right now.",
    emoji:"🏥",
    choices:[
      { label:"Within the last 3 months",   icon:"✅", value:"recent"  },
      { label:"4 – 6 months ago",           icon:"🟡", value:"mid"    },
      { label:"6 – 12 months ago",          icon:"🟠", value:"overdue"},
      { label:"Over a year ago",            icon:"🔴", value:"long"   },
      { label:"Not sure",                   icon:"🤷", value:"unsure" },
    ]
  },
];

// ─── PILLAR CONFIG ────────────────────────────────────────────────────────────
const PILLARS_CFG = {
  joint:  { label:"Joint & Mobility",  color:B.forest, bg:B.forestL, icon:"🦴" },
  coat:   { label:"Skin & Coat",       color:B.gold,   bg:B.goldXL,  icon:"✨" },
  gut:    { label:"Gut & Immune",      color:B.teal,   bg:B.tealL,   icon:"🛡️" },
  brain:  { label:"Brain & Cognitive", color:B.purp,   bg:B.purpL,   icon:"🧠" },
  inflam: { label:"Inflammation",      color:B.coral,  bg:B.coralL,  icon:"🔥" },
};

// Keep for backwards compat with gate screen
const PILLAR_COLORS = {
  "Joint & Mobility":   { color:B.forest, bg:B.forestL, icon:"🦴" },
  "Skin & Coat":        { color:B.gold,   bg:B.goldXL,  icon:"✨" },
  "Gut & Immune":       { color:B.teal,   bg:B.tealL,   icon:"🛡️" },
  "Brain & Cognitive":  { color:B.purp,   bg:B.purpL,   icon:"🧠" },
  "Inflammation":       { color:B.coral,  bg:B.coralL,  icon:"🔥" },
  "General Wellness":   { color:B.forest, bg:B.forestL, icon:"🐾" },
};

const MYTHS = {
  joint:  { myth:"It can be easy to assume stiffness is just a normal part of getting older.", truth:"In many dogs, early changes in movement may be one of the first things worth paying attention to — and they can be quite manageable when noticed early on." },
  coat:   { myth:"Coat changes are often addressed with grooming products or bathing routines.", truth:"Coat condition can sometimes reflect what's happening internally — things like nutrition and general wellbeing — rather than being purely a grooming matter." },
  gut:    { myth:"Changes in appetite or digestion are often assumed to be a phase or pickiness.", truth:"Appetite and digestive patterns can be worth paying closer attention to. They sometimes reflect shifts in overall wellbeing that are worth discussing with a vet." },
  brain:  { myth:"Behavioral shifts in older dogs are often attributed simply to slowing down with age.", truth:"Gradual changes in alertness or responsiveness can be worth monitoring more closely — especially as dogs get older, when early awareness may make a meaningful difference." },
  inflam: { myth:"If a dog were uncomfortable, most owners expect to see clearer signs of it.", truth:"Dogs often don't display discomfort in obvious ways. Subtle changes like restlessness or position-shifting can sometimes be worth noting and discussing with your vet." },
  unsure: { myth:"Not being sure which area to focus on can feel like there's nothing to act on.", truth:"Simply being aware and curious about your dog's wellbeing is a meaningful starting point. This profile may help bring some of those observations into clearer focus." },
};

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
// Higher score = more attention needed. Lowest-scoring pillars = stable.
function calculateScores(data) {
  // Base: all pillars start at 0 concern
  const s = { joint:0, coat:0, gut:0, brain:0, inflam:0 };

  // ── 1. Primary concern weights (highest signal, most direct) ──
  const concernWeights = {
    joint:  { joint:2, inflam:1 },
    coat:   { coat:2, gut:1 },
    gut:    { gut:2, inflam:1 },
    brain:  { brain:2, gut:1 },
    inflam: { inflam:2, joint:1 },
    unsure: { joint:1, brain:1, coat:1, gut:1, inflam:1 }, // spread concern equally
  };
  const cw = concernWeights[data.concern] || {};
  Object.entries(cw).forEach(([k,v]) => { s[k] = (s[k]||0) + v; });

  // ── 2. Observable signal weights (secondary confirmation) ──
  const signalWeights = {
    mobility:  { joint:1, inflam:1 },
    energy:    { brain:1, gut:1 },
    coat:      { coat:1, gut:1 },
    appetite:  { gut:2 },
    comfort:   { inflam:1, joint:1 },
    none:      {},
  };
  const sw = signalWeights[data.signal] || {};
  Object.entries(sw).forEach(([k,v]) => { s[k] = (s[k]||0) + v; });

  // ── 3. Age modifiers — older dogs carry higher baseline risk ──
  const ageMods = {
    young:   {},
    mid:     {},
    senior1: { joint:1, brain:1, inflam:1 },        // 7-8 yrs
    senior2: { joint:2, brain:2, inflam:2 },        // 9-10 yrs
    senior3: { joint:2, brain:2, inflam:2, gut:1 }, // 11+ yrs
  };
  const am = ageMods[data.age] || {};
  Object.entries(am).forEach(([k,v]) => { s[k] = (s[k]||0) + v; });

  // ── 4. Breed tendencies (light signal, acknowledged uncertainty) ──
  const breedMods = {
    retriever: { joint:1, coat:1 },           // Labs/Goldens: hips, coat
    shepherd:  { joint:1, gut:1 },            // GSDs: hips, digestion
    bulldog:   { inflam:1, joint:1, gut:1 },  // Pit Bulls: skin, joints
    large:     { joint:1, inflam:1 },         // Large breeds: general joint stress
    small:     { gut:1, brain:1 },            // Small breeds: digestion, cognitive
    mixed:     {},
  };
  const bm = breedMods[data.breed] || {};
  Object.entries(bm).forEach(([k,v]) => { s[k] = (s[k]||0) + v; });

  // ── 5. Routine modifier — no supplement support means higher vulnerability ──
  if (data.routine === "none") {
    Object.keys(s).forEach(k => { s[k] += 0.5; });
  }
  if (data.routine === "joint_supp") {
    s.joint = Math.max(0, s.joint - 1); // being addressed, reduce concern slightly
  }

  // ── 6. Vet visit — overdue means we have less data ──
  if (data.vet === "long" || data.vet === "overdue") {
    Object.keys(s).forEach(k => { s[k] += 0.3; });
  }

  // Round all scores to 1 decimal
  Object.keys(s).forEach(k => { s[k] = Math.round(s[k] * 10) / 10; });
  return s;
}

function rankPillars(scores) {
  // Sort descending — highest concern first
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score], i) => ({
      id, score,
      label:  PILLARS_CFG[id].label,
      color:  PILLARS_CFG[id].color,
      bg:     PILLARS_CFG[id].bg,
      icon:   PILLARS_CFG[id].icon,
      // Tier: top 1 = Primary, next 2 = Watch, bottom 2 = Stable
      tier: i === 0 ? "primary" : i <= 2 ? "watch" : "stable",
    }));
}

function getConfidence(data) {
  // Count meaningful answers (non-empty, non-unsure)
  let meaningful = 0;
  if (data.name)                           meaningful++;
  if (data.age && data.age !== "unsure")   meaningful++;
  if (data.breed)                          meaningful++;
  if (data.concern && data.concern !== "unsure") meaningful++;
  if (data.signal && data.signal !== "none")     meaningful++;
  if (data.vet && data.vet !== "unsure")         meaningful++;
  if (meaningful >= 5) return { level:"High",     label:"Reasonably complete profile", note:"Overview shaped by 5–6 inputs including age, breed, area of concern, and things you've observed." };
  if (meaningful >= 3) return { level:"Moderate", label:"Partial profile", note:"Overview shaped by 3–4 inputs. More context could help refine this further." };
  return               { level:"Low",      label:"General overview only", note:"Based on limited inputs. Treat this overview as general context rather than a specific finding." };
}

function getPillarExplanation(id, data) {
  const name = data.name || "your dog";
  const age  = data.age;
  const isOlder = age === "senior2" || age === "senior3";
  const explanations = {
    joint: isOlder
      ? `As dogs get older, joint comfort can become more of a factor in their day-to-day experience. Based on what you've shared about ${name}'s age, breed, and the signals you're noticing, this may be an area worth exploring with your vet and paying closer attention to over time.`
      : `The signals you've described — alongside what's generally known about ${name}'s breed — suggest joint health may be worth keeping an eye on. Paying attention to this area earlier rather than later can often make a meaningful difference.`,
    coat: `Coat changes can sometimes reflect what's happening more broadly with a dog's health — things like nutrition or general wellbeing — rather than being purely a grooming matter. Based on what you've described, this may be an area worth looking into further.`,
    gut: `A dog's digestive health is connected to many other aspects of their wellbeing. The appetite and digestive patterns you've noticed in ${name} may be worth paying closer attention to, especially at this life stage. This is a good area to raise with your vet if you haven't already.`,
    brain: `Gradual shifts in alertness or responsiveness are easy to attribute to simply slowing down with age — and sometimes that's exactly what it is. But it can also be worth monitoring more closely, particularly in older dogs, as early awareness tends to offer more options.`,
    inflam: `Dogs don't always show discomfort in obvious ways. Subtle changes like restlessness or difficulty settling can sometimes reflect ongoing low-level inflammation. Based on what you've shared, this may be an area worth discussing with your vet and supporting proactively.`,
  };
  return explanations[id] || `Based on what you've shared about ${name}, this area may be worth paying closer attention to. Your vet can help you evaluate what any of these observations might mean in practice.`;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ light=false }) {
  const c = light ? "#fff" : B.olive;
  const s = light ? "rgba(255,255,255,0.6)" : B.muted;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:38,height:38,borderRadius:10,background:light?"rgba(255,255,255,0.15)":"#F0E8CC",display:"flex",alignItems:"center",justifyContent:"center",border:light?"1px solid rgba(255,255,255,0.2)":"1px solid #DDD0A0",flexShrink:0}}>
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="22" rx="8" ry="6" fill={c}/>
          <ellipse cx="7" cy="13" rx="3.2" ry="4" fill={c} transform="rotate(-20 7 13)"/>
          <ellipse cx="13" cy="9" rx="3.2" ry="4" fill={c} transform="rotate(-5 13 9)"/>
          <ellipse cx="19" cy="9" rx="3.2" ry="4" fill={c} transform="rotate(5 19 9)"/>
          <ellipse cx="25" cy="13" rx="3.2" ry="4" fill={c} transform="rotate(20 25 13)"/>
        </svg>
      </div>
      <div>
        <div style={{fontFamily:B.ff,fontWeight:700,fontSize:19,color:c,letterSpacing:"-0.01em",lineHeight:1}}>pawgevity</div>
        <div style={{fontFamily:B.fc,fontWeight:600,fontSize:9,color:s,marginTop:2,letterSpacing:"0.12em",textTransform:"uppercase"}}>Wellness Profile</div>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ onStart }) {
  const [v, setV] = useState(false);
  useEffect(()=>{ requestAnimationFrame(()=>setV(true)); },[]);

  return (
    <div style={l.root}>
      <div style={l.bg1}/><div style={l.bg2}/>
      {/* Plum nav strip — brand accent at top */}
      <div style={l.navStrip}>
        <div style={l.goldLine}/>
        <nav style={l.nav}>
          {/* Compact nav logo — no subtitle to prevent wrapping */}
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.2)",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <ellipse cx="16" cy="22" rx="8" ry="6" fill="#E6C08A"/>
                <ellipse cx="7" cy="13" rx="3.2" ry="4" fill="#E6C08A" transform="rotate(-20 7 13)"/>
                <ellipse cx="13" cy="9" rx="3.2" ry="4" fill="#E6C08A" transform="rotate(-5 13 9)"/>
                <ellipse cx="19" cy="9" rx="3.2" ry="4" fill="#E6C08A" transform="rotate(5 19 9)"/>
                <ellipse cx="25" cy="13" rx="3.2" ry="4" fill="#E6C08A" transform="rotate(20 25 13)"/>
              </svg>
            </div>
            <div style={{fontFamily:B.ff,fontWeight:700,fontSize:18,color:"#E6C08A",letterSpacing:"-0.01em",lineHeight:1}}>pawgevity</div>
          </div>
          <div style={l.navPill}>Free · 90 sec</div>
        </nav>
      </div>

      <div style={{...l.hero, opacity:v?1:0, transform:v?"none":"translateY(24px)", transition:"all 0.7s cubic-bezier(0.34,1.1,0.64,1)"}}>
        <div style={l.badge}>
          <span style={l.dot}/>
          <span>You&apos;re already paying attention — that matters.</span>
        </div>

        <h1 style={l.h1}>
          Build your dog's<br/>
          <em style={l.em}>personalized wellness profile</em>
          <span style={{display:"block",fontFamily:B.ff,fontStyle:"normal",fontWeight:400,fontSize:"clamp(16px,4vw,20px)",color:B.taupe,marginTop:6,lineHeight:1.3}}>— and see what may be worth a closer look.</span>
        </h1>

        <p style={l.tagline}>{"\u201cThey gave you their best years. Now it\u2019s your turn.\u201d"}</p>

        <p style={l.p}>
          Answer 6 quick questions. We'll highlight which of the 5 key wellness areas may need more attention — based on your dog's age, breed, and the signals you're already noticing.
        </p>

        {/* The Scratch-style myth hook */}
        <div style={l.mythCard}>
          <div style={l.mythLabel}>🔬 Did you know?</div>
          <p style={l.mythText}>
            Many early changes in dogs are subtle — often in areas that don't show obvious signs yet. This profile helps bring those areas into focus.
          </p>
        </div>

        <div style={l.stats}>
          {[{n:"6",l:"Questions"},{n:"~90 sec",l:"To complete"},{n:"5",l:"Wellness areas"}].map((s,i)=>(
            <div key={i} style={l.stat}>
              <div style={l.statN}>{s.n}</div>
              <div style={l.statL}>{s.l}</div>
            </div>
          ))}
        </div>

        <button style={l.cta} onClick={onStart}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          Start Your Dog's Wellness Profile →
        </button>
        <p style={l.ctaNote}>Free · No credit card · Takes ~90 seconds</p>
        <div style={l.trust}>
          {["✓ Built around widely recognized canine wellness principles","✓ Guided by your dog's age, breed tendencies, and what you're observing","✓ Clear, practical guidance — not generic advice"].map((t,i)=>(
            <div key={i} style={l.trustItem}>{t}</div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={{...l.quotes, opacity:v?1:0, transition:"opacity 1.1s ease 0.5s"}}>
        {[
          {name:"Sandra M.", loc:"Sacramento, CA", q:"I hadn't really connected Bella's coat changes to what might be happening inside. This gave me a completely different way of thinking about it.", s:5},
          {name:"Mrs. Jean T.", loc:"Atlanta, GA", q:"Rudy had been slowing down and I just assumed it was age. This helped me realize there were things I could look into and actually do something about.", s:5},
          {name:"Lisa K.", loc:"Chicago, IL", q:"It felt like it was actually about Louie, not just a generic dog wellness checklist. That specificity was what made it useful.", s:5},
        ].map((t,i)=>(
          <div key={i} style={l.qCard}>
            <div style={l.stars}>{"★".repeat(t.s)}</div>
            <p style={l.qText}>"{t.q}"</p>
            <div style={l.qMeta}>{t.name} · {t.loc}</div>
          </div>
        ))}
      </div>
      <div style={l.dis}>This profile is for general wellness awareness only. It is not veterinary advice and should not replace professional care. Always consult your veterinarian about your dog&apos;s health. † These statements have not been evaluated by the Food and Drug Administration.</div>
      <div style={{textAlign:"center",paddingTop:12,paddingBottom:4}}>
        <a href="/privacy" style={{fontSize:11,color:B.muted,textDecoration:"none",fontFamily:B.fc,letterSpacing:"0.06em"}}>Privacy Policy</a>
        <span style={{color:B.border,margin:"0 8px"}}>·</span>
        <a href="mailto:hello@pawgevitywellness.com" style={{fontSize:11,color:B.muted,textDecoration:"none",fontFamily:B.fc,letterSpacing:"0.06em"}}>Contact</a>
      </div>
    </div>
  );
}

// ─── QUIZ STEP ────────────────────────────────────────────────────────────────
function QuizStep({ step, data, onAnswer, onNext, stepIdx, total }) {
  const [val, setVal]           = useState("");
  const [selected, setSelected] = useState(null);
  const [showMyth, setShowMyth] = useState(false);
  const [mythDone, setMythDone] = useState(false);
  const [anim, setAnim]         = useState(true);
  const inputRef                = useRef(null);
  const progress                = Math.round((stepIdx / total) * 100);
  const remaining               = total - stepIdx;

  useEffect(()=>{ setAnim(true); if(step.type==="text") setTimeout(()=>inputRef.current?.focus(),300); },[step]);

  const submitText = () => {
    if (!val.trim()) return;
    onAnswer(step.id, val.trim());
    setAnim(false);
    setTimeout(onNext, 250);
  };

  const selectChoice = (choice, i) => {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(step.id, choice.value);
    if (step.myth && MYTHS[choice.value]) {
      // Show myth overlay — user controls when to advance with "Got it" button
      setTimeout(()=>setShowMyth(true), 350);
    } else {
      setAnim(false);
      setTimeout(onNext, 420);
    }
  };

  const dismissMyth = () => {
    setShowMyth(false);
    setMythDone(true);
    setAnim(false);
    setTimeout(onNext, 280);
  };

  const myth = selected !== null && step.myth ? MYTHS[data[step.id] || "unsure"] : null;

  return (
    <div style={q.root}>
      {/* Top bar — compact logo, no subtitle */}
      <div style={q.topBar}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#F0E8CC",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #DDD0A0",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="22" rx="8" ry="6" fill="#685820"/>
              <ellipse cx="7" cy="13" rx="3.2" ry="4" fill="#685820" transform="rotate(-20 7 13)"/>
              <ellipse cx="13" cy="9" rx="3.2" ry="4" fill="#685820" transform="rotate(-5 13 9)"/>
              <ellipse cx="19" cy="9" rx="3.2" ry="4" fill="#685820" transform="rotate(5 19 9)"/>
              <ellipse cx="25" cy="13" rx="3.2" ry="4" fill="#685820" transform="rotate(20 25 13)"/>
            </svg>
          </div>
          <span style={{fontFamily:B.ff,fontWeight:700,fontSize:16,color:B.plum,letterSpacing:"-0.01em"}}>pawgevity</span>
        </div>
        <div style={q.pill}>{remaining} question{remaining!==1?"s":""} left</div>
      </div>

      {/* Progress */}
      <div style={q.track}>
        <div style={{...q.fill, width:`${progress}%`}}/>
      </div>

      {/* Question */}
      <div style={{...q.card, opacity:anim?1:0, transform:anim?"none":"translateX(-20px)", transition:"all 0.26s ease"}}>
        <div style={q.emoji}>{step.emoji}</div>
        <h2 style={q.question}>{step.q(data)}</h2>
        {step.sub && <p style={q.sub}>{step.sub}</p>}

        {step.type==="text" && (
          <div style={q.textWrap}>
            <input ref={inputRef} style={q.input} placeholder={step.placeholder}
              value={val} onChange={e=>setVal(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submitText()}/>
            <button style={{...q.nextBtn, opacity:val.trim()?1:0.4}} onClick={submitText} disabled={!val.trim()}>
              Continue →
            </button>
            <p style={{fontSize:13,color:B.muted,textAlign:"center",marginTop:8,lineHeight:1.6}}>
              This takes about 90 seconds — and everything is specific to your dog.
            </p>
          </div>
        )}

        {step.type==="choice" && (
          <div style={q.choices}>
            {step.choices.map((c,i)=>{
              const isSel   = selected===i;
              const isOther = selected!==null && !isSel;
              return (
                <button key={i} style={{
                  ...q.choice,
                  ...(isSel   ? {borderColor:"#B8874F",background:"#FBF3E3",transform:"scale(1.01)"} : {}),
                  ...(isOther ? {opacity:0.3,transform:"scale(0.97)"} : {}),
                  transition:"all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                }} onClick={()=>selectChoice(c,i)} disabled={selected!==null}>
                  <span style={{fontSize:22,flexShrink:0}}>{c.icon}</span>
                  <span style={{fontSize:15,fontWeight:isSel?700:500,color:isSel?B.plum:B.text,flex:1,textAlign:"left",lineHeight:1.4}}>
                    {c.label}
                  </span>
                  {isSel && <div style={{...q.check,background:"linear-gradient(135deg,#B8874F,#E6C08A)",color:B.plum}}>✓</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Myth overlay — Scratch-style educational reveal */}
      {showMyth && myth && (
        <div style={q.mythOverlay}>
          <div style={q.mythCard}>
            <div style={q.mythHead}>
              <span style={q.mythIcon}>🔬</span>
              <span style={q.mythLabel2}>What the data actually shows</span>
            </div>
            <p style={q.mythMythTxt}><strong>What most owners think:</strong> {myth.myth}</p>
            <p style={q.mythTruth}><strong>What&apos;s actually happening:</strong> {myth.truth}</p>
            <button
              style={{
                width:"100%", background:"linear-gradient(135deg,#B8874F,#D4A373,#E6C08A)", color:B.plum, border:"none",
                borderRadius:14, padding:"16px 24px", fontSize:16, fontWeight:700,
                cursor:"pointer", fontFamily:B.ff, marginTop:4
              }}
              onClick={dismissMyth}
            >
              Understood — continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALCULATING SCREEN ───────────────────────────────────────────────────────
// Farmer's Dog / Ollie use a loading/calculating screen — creates anticipation before gate
function Calculating({ data, onDone }) {
  const [step, setStep] = useState(0);
  const pillar = data.concern
    ? (STEPS[3].choices.find(c=>c.value===data.concern)?.pillar || "General Wellness")
    : "General Wellness";

  const steps2 = [
    `Reviewing ${data.name}'s age and breed context…`,
    `Considering the signals you've described…`,
    `Weighing inputs across the 5 wellness areas…`,
    `Putting together a personalized overview…`,
    `Adding some helpful context to each area…`,
    `${data.name}'s profile is ready to view.`,
  ];

  useEffect(()=>{
    const timers = steps2.map((_,i)=>setTimeout(()=>setStep(i), i*700));
    const done = setTimeout(onDone, steps2.length*700 + 400);
    return ()=>{ timers.forEach(clearTimeout); clearTimeout(done); };
  },[]);

  const pct = Math.round(((step+1)/steps2.length)*100);

  return (
    <div style={calc.root}>
      <Logo/>
      <div style={calc.card}>
        <div style={calc.dogName}>{data.name}</div>
        <div style={calc.subHead}>Wellness Profile</div>

        <div style={calc.ringWrap}>
          <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#F0DCC8" strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#D4A373" strokeWidth="8"
              strokeDasharray={`${(pct/100)*314} 314`} strokeLinecap="round"
              style={{transition:"stroke-dasharray 0.6s ease"}}/>
          </svg>
          <div style={calc.pct}>{pct}%</div>
        </div>

        <div style={calc.stepList}>
          {steps2.map((s,i)=>(
            <div key={i} style={{...calc.stepItem, opacity:step>=i?1:0.2, transition:`opacity 0.4s ease ${i*0.1}s`}}>
              <span style={{...calc.stepDot, background:step>=i?"#D4A373":B.border}}/>
              <span style={{fontSize:14, color:step>=i?B.navy:B.muted, fontWeight:step===i?600:400}}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{...calc.pillarPill, background:PILLAR_COLORS[pillar]?.bg, color:PILLAR_COLORS[pillar]?.color, border:`1px solid ${PILLAR_COLORS[pillar]?.color}44`}}>
          {PILLAR_COLORS[pillar]?.icon} Area to explore first: {pillar}
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL GATE ───────────────────────────────────────────────────────────────
function Gate({ data, onCapture }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const valid = email.includes("@") && email.includes(".");
  // Use scoring engine to determine primary concern for gate teaser
  const gScores  = calculateScores(data);
  const gRanked  = rankPillars(gScores);
  const gPrimary = gRanked[0];
  const pillar   = gPrimary?.label || "General Wellness";
  const pc       = { color:gPrimary?.color||B.forest, bg:gPrimary?.bg||B.forestL, icon:gPrimary?.icon||"🐾" };

  const submit = async () => {
    if (!valid) { setErr("Please enter a valid email address."); return; }
    setLoading(true);

    // ── Klaviyo API — push profile with all quiz data ──
    const KLAVIYO_PUBLIC_KEY = "Vbubpy";
    const KLAVIYO_LIST_ID    = "Vzr5VU";

    // Map internal values to readable labels for Klaviyo
    const breedMap    = { retriever:"Golden/Lab", shepherd:"German Shepherd", bulldog:"Pit Bull/Bulldog", small:"Small breed", large:"Large breed", mixed:"Mixed breed" };
    const ageMap      = { young:"Under 5 years", mid:"5-6 years", senior1:"7-8 years", senior2:"9-10 years", senior3:"11+ years" };
    const concernMap  = { joint:"Joint & Mobility", coat:"Skin & Coat", gut:"Gut & Immune", brain:"Brain & Cognitive", inflam:"Inflammation", unsure:"Not sure yet" };
    const routineMap  = { none:"No supplements", joint_supp:"Joint supplement or fish oil", multi:"Multivitamin or probiotic", rx:"Prescription/vet diet", multi_supp:"Multiple supplements" };
    const signalMap   = { mobility:"Slower to get up", energy:"Less interested in walks", coat:"Dull coat or shedding", appetite:"Picky eating", comfort:"Restless sleep", none:"Nothing noticeable" };
    const vetMap      = { recent:"Within 3 months", mid:"4-6 months ago", overdue:"6-12 months ago", long:"Over a year ago", unsure:"Not sure" };

    try {
      // Step 1 — Create/update profile with all dog data
      await fetch(`https://a.klaviyo.com/client/profiles/?company_id=${KLAVIYO_PUBLIC_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json", "revision": "2023-12-15" },
        body: JSON.stringify({
          data: {
            type: "profile",
            attributes: {
              email: email,
              first_name: data.name || "",
              properties: {
                dog_name:          data.name                               || "",
                dog_breed:         breedMap[data.breed]   || data.breed   || "",
                dog_age:           ageMap[data.age]       || data.age     || "",
                primary_concern:   concernMap[data.concern]|| data.concern|| "",
                current_routine:   routineMap[data.routine]|| data.routine|| "",
                observable_signal: signalMap[data.signal]  || data.signal || "",
                last_vet_visit:    vetMap[data.vet]        || data.vet    || "",
                source:            "pawgevity_wellness_quiz",
                quiz_completed_date: new Date().toISOString().split("T")[0],
                has_supplement:    data.routine !== "none" ? "Yes" : "No",
                vet_overdue:       (data.vet === "overdue" || data.vet === "long") ? "Yes" : "No",
                dog_is_older:      (data.age === "senior2" || data.age === "senior3") ? "Yes" : "No",
              }
            }
          }
        })
      });

      // Step 2 — Subscribe to list (correct Klaviyo client API structure)
      await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_PUBLIC_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json", "revision": "2023-12-15" },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: { email: email }
                }
              }
            },
            relationships: {
              list: {
                data: { type: "list", id: KLAVIYO_LIST_ID }
              }
            }
          }
        })
      });

    } catch(e) {
      console.error("Klaviyo error:", e);
    }

    onCapture(email);
  };

  return (
    <div style={g.root}>
      {/* Profile card preview — teases what's behind the gate */}
      <div style={g.preview}>
        <div style={g.previewHead}>
          <div style={{...g.previewAvatar, background:pc.color}}>{data.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={g.previewName}>{data.name}'s Wellness Profile</div>
            <div style={g.previewSub}>6 questions · 5 areas reviewed · Profile ready</div>
          </div>
          <div style={g.previewCheck}>✓</div>
        </div>

        {/* Blurred cards */}
        <div style={g.blurWrap}>
          <div style={g.blurInner}>
            {["Primary area to explore","Age-related context","Starting point suggestions","Supplement considerations","Questions for your vet"].map((item,i)=>(
              <div key={i} style={g.blurItem}>
                <div style={g.blurDot}/>
                <div style={{height:12, background:B.border, borderRadius:6, flex:1}}/>
              </div>
            ))}
          </div>
          <div style={g.blurOverlay}/>
          <div style={g.lockBadge}>
            <span>🔒</span>
            <span>Enter your email to see the full overview</span>
          </div>
        </div>

        {/* Teaser — specific to their concern */}
        <div style={{...g.tease, borderColor:pc.color+"44", background:pc.bg}}>
          <span style={{fontSize:22}}>{pc.icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:pc.color,marginBottom:3}}>
              {pillar} may be worth exploring first for {data.name}
            </div>
            <div style={{fontSize:13,color:B.sub,lineHeight:1.5}}>
              Your full overview includes some context on this area and practical suggestions for all 5.
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={g.form}>
        <h2 style={g.formH}>Where should we send {data.name}'s profile?</h2>
        <p style={g.formP}>Enter your email and we&apos;ll share the full overview right away — including some thoughtful context for each area and a practical starting point based on what you&apos;ve told us.</p>

        <label style={g.label}>Your email address</label>
        <input style={{...g.input,...(err?{borderColor:B.coral}:{})}} type="email"
          placeholder="yourname@email.com" value={email} autoFocus
          onChange={e=>{setEmail(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&!loading&&submit()}/>
        {err&&<p style={g.err}>{err}</p>}

        <button style={{...g.btn,opacity:valid?1:0.45}} onClick={submit} disabled={loading||!valid}>
          {loading
            ? <><span style={g.spin}/>Preparing your profile…</>
            : `See ${data.name}'s Full Profile →`}
        </button>
        <p style={g.fine}>Free · No spam · Unsubscribe anytime · By pawgevity™</p>
        <p style={{textAlign:"center",fontSize:11,color:B.muted,marginTop:6}}>
          By continuing you agree to our{" "}
          <a href="/privacy" style={{color:B.taupe,textDecoration:"underline",textDecorationColor:B.border}}>Privacy Policy</a>
        </p>
        <p style={g.dis}>† This overview is for general wellness awareness only. It is not a diagnosis or veterinary advice. Always consult your vet for guidance on your dog&apos;s health. Not evaluated by the FDA. Individual context varies.</p>
      </div>
    </div>
  );
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function Results({ data, email }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVis(true),200); },[]);

  // ── Run the scoring engine ──
  const scores     = calculateScores(data);
  const ranked     = rankPillars(scores);
  const primary    = ranked[0];
  const watchAreas = ranked.slice(1,3);
  const stable     = ranked.slice(3);
  const confidence = getConfidence(data);
  const myth       = data.concern ? MYTHS[data.concern] : null;

  // Readable labels
  const ageLabel = {
    young:"Under 5 yrs", mid:"5–6 yrs", senior1:"7–8 yrs",
    senior2:"9–10 yrs", senior3:"11+ yrs"
  }[data.age] || data.age;

  const breedLabel = {
    retriever:"Golden/Lab", shepherd:"German Shepherd", bulldog:"Pit Bull/Bulldog",
    large:"Large breed", small:"Small breed", mixed:"Mixed breed"
  }[data.breed] || data.breed;

  const routineInsight = {
    none:       `${data.name} isn't currently on a supplement routine — which is very common. It may simply mean there's more that could be explored when the time feels right.`,
    joint_supp: `It's great that you're already paying attention to joints. It may be worth considering whether the full picture — including areas like gut health and general inflammation support — is also being looked at.`,
    multi:      `A multivitamin or probiotic is a reasonable starting point. As ${data.name} gets older, it may be worth checking in with your vet about whether the current support is still well-matched.`,
    rx:         `A vet-recommended diet is a thoughtful foundation. It may be worth asking your vet whether there are additional areas — like inflammation or cognitive wellness — worth supporting alongside it as your dog gets older.`,
    multi_supp: `Using several supplements can work well. It may occasionally be worth reviewing with your vet to make sure the combination makes sense and there's no unnecessary overlap.`,
  }[data.routine] || `${data.name}'s current routine is a good starting point.`;

  const tierStyle = {
    primary:{ label:"Explore First", badge:"→ Explore First", badgeBg:primary.color, chipBg:primary.color+"18", chipColor:primary.color },
    watch:  { label:"Worth Watching", badge:"👁 Worth Watching",    badgeBg:B.gold,        chipBg:B.goldXL,            chipColor:B.gold },
    stable: { label:"Stable",        badge:"✓ Stable",         badgeBg:B.forest,      chipBg:B.forestL,           chipColor:B.forest },
  };

  return (
    <div style={r.root}>
      {/* Plum header */}
      <div style={r.header}>
        <div style={r.headerNav}><Logo light/><div style={r.hBadge}>Wellness Profile</div></div>
        <div style={{...r.profileCard, opacity:vis?1:0, transform:vis?"none":"translateY(16px)", transition:"all 0.7s ease"}}>
          <div style={r.profileAvatar}>{data.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={r.profileName}>{data.name}</div>
            <div style={r.profileMeta}>{ageLabel}{breedLabel ? ` · ${breedLabel}` : ""}</div>
            <div style={r.profileTag}>Profile Complete ✓</div>
          </div>
        </div>
      </div>

      <div style={r.body}>

        {/* Confidence badge */}
        <div style={{display:"flex",alignItems:"flex-start",gap:12,background:B.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${B.border}`,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
          <div style={{width:36,height:36,borderRadius:10,background:confidence.level==="High"?B.forestL:confidence.level==="Moderate"?B.goldXL:B.coralL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
            {confidence.level==="High"?"✓":confidence.level==="Moderate"?"~":"!"}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:confidence.level==="High"?B.forest:confidence.level==="Moderate"?B.gold:B.coral,fontFamily:B.fc,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{confidence.label}</div>
            <div style={{fontSize:13,color:B.sub,lineHeight:1.6}}>{confidence.note}</div>
          </div>
        </div>

        {/* Primary focus card */}
        <div style={{...r.findingCard, borderColor:primary.color, background:primary.bg}}>
          <div style={{...r.findingTag, background:primary.color}}>{primary.icon} Area to Explore First</div>
          <h2 style={{...r.findingTitle, color:primary.color}}>{primary.label}</h2>
          <p style={r.findingText}>{getPillarExplanation(primary.id, data)}</p>
          {myth && (
            <div style={r.mythBox}>
              <div style={{fontSize:12,fontWeight:700,color:primary.color,marginBottom:6,fontFamily:B.fc,letterSpacing:"0.06em",textTransform:"uppercase"}}>🔬 What you may not know yet</div>
              <p style={{fontSize:14,color:B.text,lineHeight:1.7}}>{myth.truth}</p>
            </div>
          )}
        </div>

        {/* Watch areas */}
        {watchAreas.length > 0 && (
          <div style={r.card}>
            <div style={r.cardTitle}>👁 Worth Keeping an Eye On</div>
            {watchAreas.map(p=>(
              <div key={p.id} style={{...r.pillarRow, borderLeft:`4px solid ${p.color}`}}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:p.color,marginBottom:3}}>{p.label}</div>
                  <div style={{fontSize:12,color:B.sub,lineHeight:1.55}}>{getPillarExplanation(p.id, data).split(".")[0]}.</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5-pillar ranked overview */}
        <div style={r.card}>
          <div style={r.cardTitle}>5-Area Wellness Overview</div>
          <div style={{fontSize:12,color:B.muted,marginBottom:14,lineHeight:1.5}}>Ordered by what may benefit from the most attention, based on what you've shared about {data.name}. These are general observations — not diagnoses.</div>
          {ranked.map((p,i)=>{
            const ts = tierStyle[p.tier];
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"10px 12px",background:p.tier==="primary"?p.bg:B.cream,borderRadius:12,border:p.tier==="primary"?`1.5px solid ${p.color}44`:`1px solid ${B.border}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:p.tier==="primary"?p.color:p.tier==="watch"?B.goldXL:B.forestL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:B.fc,fontWeight:700,fontSize:11,color:p.tier==="primary"?"#fff":p.tier==="watch"?B.gold:B.forest}}>
                  {i+1}
                </div>
                <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:p.color}}>{p.label}</div>
                </div>
                <div style={{fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:100,background:ts.chipBg,color:ts.chipColor,border:`1px solid ${ts.chipColor}44`,fontFamily:B.fc,letterSpacing:"0.04em",flexShrink:0}}>
                  {ts.badge}
                </div>
              </div>
            );
          })}
        </div>

        {/* Routine insight */}
        <div style={r.card}>
          <div style={r.cardTitle}>💊 A note on {data.name}'s current routine</div>
          <p style={r.cardText}>{routineInsight}</p>
        </div>

        {/* What's in your email */}
        <div style={r.emailCard}>
          <div style={r.emailTitle}>📧 What we&apos;re sending to your inbox</div>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",marginBottom:16,lineHeight:1.6}}>
            We're sending a more detailed overview to <strong style={{color:"#fff"}}>{email}</strong> with things worth exploring further:
          </p>
          {[
            `Practical suggestions for ${data.name}'s ${primary.label} area`,
            `Some background on why each area may be worth attention`,
            "A gentle 4-week starting point based on what you've shared",
            `Supplement context that may be relevant to ${data.name}'s profile`,
            "A few helpful questions to bring to your next vet visit",
          ].map((item,i)=>(
            <div key={i} style={r.emailItem}>
              <span style={{color:"#D4A373",flexShrink:0,fontWeight:700}}>✓</span>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>{item}</span>
            </div>
          ))}
        </div>

        {/* What to do next */}
        <div style={r.card}>
          <div style={r.cardTitle}>What to do right now</div>
          {[
            {n:"1",title:"Check your inbox",body:`We're sending a fuller overview to your email with some practical context and starting points based on what you've shared about ${data.name}.`},
            {n:"2",title:`Consider tracking ${data.name} week over week`,body:`A single snapshot gives you a starting point. Checking in regularly with PawWatch can help you notice gradual changes over time — which is often when the most useful patterns emerge.`},
            {n:"3",title:"Share this with your vet",body:`If anything in this overview feels worth exploring, bring it to your next appointment. Your vet is the right person to evaluate what any of these observations might mean for ${data.name}.`},
          ].map((s,i)=>(
            <div key={i} style={r.step}>
              <div style={r.stepN}>{s.n}</div>
              <div>
                <div style={r.stepTitle}>{s.title}</div>
                <div style={r.stepBody}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PawWatch CTA */}
        <div style={r.pawCard}>
          <div style={r.trackTop}>
            <div style={r.pawIcon}>📱</div>
            <div style={{flex:1}}>
              <div style={r.pawTitle}>Track {data.name}'s progress over time</div>
              <div style={r.pawSub}>PawWatch gives you weekly check-ins, trend charts, and a vet-shareable report — free.</div>
            </div>
          </div>
          <button style={r.pawBtn} onClick={()=>alert("Opens PawWatch app.")}>Open PawWatch — Free →</button>
        </div>

        {/* Share */}
        <button style={r.shareBtn} onClick={()=>{
          if(navigator.share){navigator.share({title:`${data.name}'s Wellness Profile`,text:`I just built a free dog wellness profile with Pawgevity — it's a helpful way to think about your dog's health:`,url:"https://check.pawgevitywellness.com"});}
          else{navigator.clipboard.writeText("https://check.pawgevitywellness.com");alert("Link copied!");}
        }}>Share this with another dog owner 🔗</button>

        <div style={r.dis}>
          <strong>Please note:</strong> This overview is for general wellness awareness only. It is not a diagnosis, clinical assessment, or substitute for veterinary care. Everything here is based on general wellness principles and the inputs you've provided — not a medical evaluation of your dog. Please consult your veterinarian for guidance on your dog's health. † These statements have not been evaluated by the Food and Drug Administration. Individual context varies.
        </div>
        <div style={r.footer}>
          <div style={{fontFamily:B.fn,fontWeight:700,fontSize:13,color:B.muted}}>pawgevity™</div>
          <div style={{fontSize:11,color:B.border,marginTop:3}}>Results sent to {email} · © {new Date().getFullYear()} Pawgevity</div>
        </div>
      </div>
    </div>
  );
}
// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]   = useState("land");
  const [stepIdx, setStepIdx] = useState(0);
  const [data,    setData]    = useState({});
  const [email,   setEmail]   = useState("");

  const handleAnswer = (id, val) => setData(d=>({...d,[id]:val}));
  const handleNext   = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(i=>i+1);
    else setScreen("calc");
  };

  return (
    <div style={{fontFamily:`'Outfit',sans-serif`,background:B.cream,minHeight:"100vh",maxWidth:500,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:'Outfit',sans-serif;cursor:pointer;}
        input{font-family:'Outfit',sans-serif;}
        input:focus{outline:none;border-color:#B8874F!important;box-shadow:0 0 0 3px rgba(184,135,79,0.15);}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mythIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#DDE6E1;border-radius:2px;}
      `}</style>

      {screen==="land" && <Landing onStart={()=>setScreen("quiz")}/>}
      {screen==="quiz" && (
        <QuizStep key={stepIdx} step={STEPS[stepIdx]} data={data}
          onAnswer={handleAnswer} onNext={handleNext}
          stepIdx={stepIdx} total={STEPS.length}/>
      )}
      {screen==="calc" && <Calculating data={data} onDone={()=>setScreen("gate")}/>}
      {screen==="gate" && <Gate data={data} onCapture={e=>{setEmail(e);setScreen("results");}}/>}
      {screen==="results" && <Results data={data} email={email}/>}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const l = {
  // Deep plum hero — Pawgevity brand standard
  root:     { background:B.creamL, minHeight:"100vh", padding:"0 0 48px", position:"relative", overflow:"hidden" },
  // Decorative gold orbs for depth
  bg1:      { position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"rgba(184,135,79,0.06)", pointerEvents:"none" },
  bg2:      { position:"absolute", bottom:-60, left:-60, width:260, height:260, borderRadius:"50%", background:"rgba(184,135,79,0.04)", pointerEvents:"none" },
  // Gold divider line at top
  goldLine: { height:3, background:"linear-gradient(90deg,#B8874F,#D4A373,#E6C08A,#D4A373,#B8874F)" },
  navStrip: { background:B.plum, padding:"0" },
  nav:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px" },
  navPill:  { background:"rgba(184,135,79,0.15)", border:"1px solid rgba(212,163,115,0.35)", borderRadius:100, padding:"6px 16px", fontSize:11, fontWeight:600, color:"#D4A373", fontFamily:B.fc, letterSpacing:"0.1em" },
  hero:     { padding:"16px 24px 32px" },
  badge:    { display:"inline-flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,#B8874F,#D4A373,#E6C08A)", border:"none", borderRadius:100, padding:"11px 20px", fontSize:13, fontWeight:700, color:"#3D1225", marginBottom:22, fontFamily:B.ff, boxShadow:"0 4px 16px rgba(184,135,79,0.3)", letterSpacing:"-0.01em" },
  dot:      { width:9, height:9, borderRadius:"50%", background:"#3D1225", display:"inline-block", opacity:0.4 },
  h1:       { fontFamily:B.ff, fontSize:"clamp(30px,7vw,44px)", fontWeight:700, color:B.plum, lineHeight:1.15, marginBottom:16 },
  em:       { display:"block", fontStyle:"italic", color:B.gold },
  tagline:  { fontFamily:B.ff, fontStyle:"italic", fontSize:15, color:B.taupe, marginBottom:18, lineHeight:1.5 },
  p:        { fontSize:16, color:B.text, lineHeight:1.75, marginBottom:22, maxWidth:440 },
  mythCard: { background:B.goldXL, border:"1px solid #D4A373", borderRadius:16, padding:"16px 18px", marginBottom:22 },
  mythLabel:{ fontSize:10, fontWeight:700, color:B.plum, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, fontFamily:B.fc },
  mythText: { fontSize:14, color:B.text, lineHeight:1.7 },
  stats:    { display:"flex", background:B.white, borderRadius:14, border:`1px solid ${B.border}`, overflow:"hidden", marginBottom:22, boxShadow:"0 2px 12px rgba(184,135,79,0.1)" },
  stat:     { flex:1, padding:"14px 10px", textAlign:"center", borderRight:`1px solid ${B.border}` },
  statN:    { fontFamily:B.ff, fontSize:22, fontWeight:700, color:B.plum, lineHeight:1 },
  statL:    { fontSize:11, color:B.taupe, marginTop:4, lineHeight:1.3 },
  // Gold gradient CTA — Pawgevity brand standard
  cta:      { display:"block", width:"100%", background:"linear-gradient(135deg,#B8874F,#D4A373,#E6C08A)", color:B.plum, border:"none", borderRadius:16, padding:"20px 24px", fontSize:17, fontWeight:800, textAlign:"center", marginBottom:12, boxShadow:"0 8px 32px rgba(184,135,79,0.35)", letterSpacing:"-0.01em", transition:"transform 0.15s, box-shadow 0.15s", fontFamily:B.ff },
  ctaNote:  { textAlign:"center", fontSize:13, color:B.taupe, marginBottom:20 },
  trust:    { display:"flex", flexDirection:"column", gap:8, marginBottom:4 },
  trustItem:{ fontSize:14, color:B.text, fontWeight:500 },
  quotes:   { padding:"0 20px", display:"flex", flexDirection:"column", gap:12 },
  qCard:    { background:B.white, border:`1px solid ${B.border}`, borderRadius:16, padding:"18px 20px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" },
  stars:    { color:B.gold, fontSize:13, marginBottom:8, letterSpacing:2 },
  qText:    { fontSize:14, color:B.text, lineHeight:1.65, marginBottom:10, fontStyle:"italic", fontFamily:B.ff },
  qMeta:    { fontSize:11, color:B.muted, fontWeight:600, fontFamily:B.fc, letterSpacing:"0.06em" },
  dis:      { fontSize:11, color:B.muted, textAlign:"center", padding:"18px 24px 0", lineHeight:1.6 },
};

const q = {
  root:         { background:B.cream, minHeight:"100vh", display:"flex", flexDirection:"column" },
  topBar:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px 10px" },
  pill:         { background:"rgba(184,135,79,0.08)", border:"1.5px solid rgba(184,135,79,0.4)", borderRadius:100, padding:"6px 14px", fontSize:12, fontWeight:700, color:B.plum, fontFamily:B.fc, letterSpacing:"0.06em" },
  track:        { height:5, background:B.border, overflow:"hidden", flexShrink:0 },
  fill:         { height:"100%", background:"linear-gradient(90deg,#B8874F,#D4A373,#E6C08A)", transition:"width 0.5s ease" },
  card:         { flex:1, padding:"16px 22px 40px" },
  emoji:        { fontSize:44, marginBottom:14, display:"block" },
  question:     { fontFamily:B.ff, fontSize:"clamp(20px,5vw,26px)", fontWeight:700, color:B.navy, lineHeight:1.3, marginBottom:12 },
  sub:          { fontSize:14, color:B.sub, lineHeight:1.65, marginBottom:22 },
  textWrap:     { display:"flex", flexDirection:"column", gap:12 },
  input:        { width:"100%", border:`2px solid ${B.border}`, borderRadius:14, padding:"17px 18px", fontSize:17, color:B.text, background:B.white, transition:"border-color 0.2s, box-shadow 0.2s" },
  nextBtn:      { background:"linear-gradient(135deg,#B8874F,#D4A373,#E6C08A)", color:B.plum, border:"none", borderRadius:14, padding:"18px 24px", fontSize:17, fontWeight:700, boxShadow:"0 4px 20px rgba(184,135,79,0.35)" },
  choices:      { display:"flex", flexDirection:"column", gap:10 },
  choice:       { display:"flex", alignItems:"center", gap:14, padding:"16px 18px", background:B.white, border:`2px solid ${B.border}`, borderRadius:16, boxShadow:"0 1px 6px rgba(0,0,0,0.04)" },
  check:        { width:26, height:26, borderRadius:"50%", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:"up 0.2s ease" },
  mythOverlay:  { position:"fixed", inset:0, background:"rgba(58,18,37,0.93)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:"24px", backdropFilter:"blur(4px)" },
  mythCard:     { background:B.white, borderRadius:22, padding:"32px 26px", width:"100%", maxWidth:440, animation:"mythIn 0.35s cubic-bezier(0.34,1.2,0.64,1)" },
  mythHead:     { display:"flex", alignItems:"center", gap:10, marginBottom:16 },
  mythIcon:     { fontSize:24 },
  mythLabel2:   { fontSize:10, fontWeight:600, color:B.goldM, textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:B.fc },
  mythMythTxt:  { fontSize:15, color:B.muted, lineHeight:1.7, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${B.border}` },
  mythTruth:    { fontSize:16, color:B.text, lineHeight:1.75, marginBottom:18 },
  mythCont:     { fontSize:13, color:B.muted, textAlign:"center" },
};

const calc = {
  root:     { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", background:`linear-gradient(160deg,${B.creamL},${B.cream})` },
  card:     { background:B.white, borderRadius:24, padding:"40px 28px", width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(11,77,55,0.1)", border:`1px solid ${B.border}`, textAlign:"center", marginTop:24, animation:"up 0.4s ease" },
  dogName:  { fontFamily:B.ff, fontSize:28, fontWeight:700, color:B.navy, lineHeight:1 },
  subHead:  { fontSize:14, color:B.muted, marginTop:6, marginBottom:28, letterSpacing:"0.04em", textTransform:"uppercase" },
  ringWrap: { position:"relative", width:120, height:120, margin:"0 auto 28px" },
  pct:      { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:B.ff, fontSize:26, fontWeight:700, color:B.plum },
  stepList: { display:"flex", flexDirection:"column", gap:12, marginBottom:24, textAlign:"left" },
  stepItem: { display:"flex", alignItems:"center", gap:10, transition:"opacity 0.4s ease" },
  stepDot:  { width:8, height:8, borderRadius:"50%", flexShrink:0, transition:"background 0.3s ease" },
  pillarPill:{ display:"inline-block", borderRadius:100, padding:"8px 18px", fontSize:13, fontWeight:700 },
};

const g = {
  root:       { background:B.plumGrad, minHeight:"100vh", padding:"24px 20px 48px" },
  preview:    { background:B.white, borderRadius:20, padding:"22px 20px", marginBottom:16, boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:`1px solid ${B.border}` },
  previewHead:{ display:"flex", alignItems:"center", gap:14, marginBottom:20 },
  previewAvatar:{ width:48, height:48, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:B.ff, fontSize:20, fontWeight:700, flexShrink:0 },
  previewName:{ fontFamily:B.ff, fontSize:18, fontWeight:700, color:B.navy },
  previewSub: { fontSize:13, color:B.muted, marginTop:2 },
  previewCheck:{ marginLeft:"auto", width:32, height:32, borderRadius:"50%", background:"#FBF3E3", color:B.plum, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, flexShrink:0 },
  blurWrap:   { position:"relative", borderRadius:14, overflow:"hidden", marginBottom:16 },
  blurInner:  { background:B.forestL, padding:"20px", display:"flex", flexDirection:"column", gap:12 },
  blurItem:   { display:"flex", alignItems:"center", gap:10 },
  blurDot:    { width:10, height:10, borderRadius:"50%", background:B.border, flexShrink:0 },
  blurOverlay:{ position:"absolute", inset:0, backdropFilter:"blur(10px)", background:"rgba(250,247,241,0.75)" },
  lockBadge:  { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:B.white, border:`2px solid ${B.forest}`, borderRadius:100, padding:"10px 20px", fontSize:14, fontWeight:700, color:B.forest, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(11,77,55,0.15)", display:"flex", alignItems:"center", gap:8 },
  tease:      { display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", borderRadius:14, border:"1.5px solid" },
  form:       { background:B.white, borderRadius:20, padding:"26px 22px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:`1px solid ${B.border}` },
  formH:      { fontFamily:B.ff, fontSize:22, fontWeight:700, color:B.navy, marginBottom:10 },
  formP:      { fontSize:15, color:B.sub, lineHeight:1.65, marginBottom:22 },
  label:      { display:"block", fontSize:14, fontWeight:700, color:B.text, marginBottom:10 },
  input:      { width:"100%", border:`2px solid ${B.border}`, borderRadius:14, padding:"17px 18px", fontSize:16, color:B.text, background:B.cream, marginBottom:8, transition:"all 0.2s" },
  err:        { fontSize:14, color:B.coral, fontWeight:600, marginBottom:10 },
  btn:        { width:"100%", background:B.forest, color:"#fff", border:"none", borderRadius:14, padding:"18px 24px", fontSize:17, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:12, boxShadow:"0 4px 20px rgba(11,77,55,0.22)", transition:"all 0.2s" },
  spin:       { width:20, height:20, border:"3px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" },
  fine:       { textAlign:"center", fontSize:13, color:B.muted, marginBottom:10 },
  dis:        { fontSize:11, color:B.muted, textAlign:"center", lineHeight:1.65 },
};

const r = {
  root:        { background:B.cream, minHeight:"100vh" },
  header:      { background:B.plum, padding:"18px 20px 22px" },
  headerNav:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 },
  hBadge:      { background:"rgba(184,135,79,0.15)", border:"1px solid rgba(212,163,115,0.35)", borderRadius:100, padding:"6px 16px", fontSize:10, fontWeight:600, color:"#D4A373", fontFamily:B.fc, letterSpacing:"0.1em" },
  profileCard: { display:"flex", alignItems:"center", gap:16 },
  profileAvatar:{ width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:B.ff, fontSize:26, fontWeight:700, flexShrink:0 },
  profileName: { fontFamily:B.ff, fontSize:24, fontWeight:700, color:"#fff", marginBottom:4 },
  profileMeta: { fontSize:13, color:"rgba(255,255,255,0.7)" },
  profileTag:  { fontSize:12, color:"#7EDDB0", fontWeight:700, marginTop:4 },
  body:        { padding:"18px 18px 48px", display:"flex", flexDirection:"column", gap:16 },
  findingCard: { borderRadius:20, padding:"22px 20px", border:"2px solid", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" },
  findingTag:  { display:"inline-block", color:"#fff", fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:100, marginBottom:12, letterSpacing:"0.04em" },
  findingTitle:{ fontFamily:B.ff, fontSize:22, fontWeight:700, marginBottom:12 },
  findingText: { fontSize:15, color:B.text, lineHeight:1.75, marginBottom:16 },
  mythBox:     { background:"rgba(255,255,255,0.5)", borderRadius:12, padding:"14px 16px" },
  card:        { background:B.white, borderRadius:20, padding:"22px 20px", boxShadow:"0 2px 16px rgba(0,0,0,0.05)", border:`1px solid ${B.border}` },
  cardTitle:   { fontFamily:B.ff, fontSize:17, fontWeight:700, color:B.navy, marginBottom:14 },
  cardText:    { fontSize:15, color:B.sub, lineHeight:1.75 },
  pillarRow:   { display:"flex", alignItems:"center", gap:12, marginBottom:12, padding:"10px 12px", background:B.cream, borderRadius:10 },
  statusChip:  { fontSize:12, fontWeight:700, padding:"5px 10px", borderRadius:100, flexShrink:0 },
  emailCard:   { background:B.navy, borderRadius:20, padding:"24px 22px" },
  emailTitle:  { fontFamily:B.ff, fontSize:18, fontWeight:700, color:"#fff", marginBottom:12 },
  emailItem:   { display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 },
  step:        { display:"flex", gap:14, alignItems:"flex-start", marginBottom:18 },
  stepN:       { width:30, height:30, borderRadius:"50%", background:"#FBF3E3", color:B.plum, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0, marginTop:2 },
  stepTitle:   { fontSize:15, fontWeight:700, color:B.navy, marginBottom:5 },
  stepBody:    { fontSize:13, color:B.sub, lineHeight:1.65 },
  pawCard:     { background:B.white, borderRadius:20, padding:"20px 20px", border:`1px solid ${B.border}`, boxShadow:"0 2px 16px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" },
  pawIcon:     { fontSize:30, flexShrink:0 },
  pawTitle:    { fontFamily:B.ff, fontSize:16, fontWeight:700, color:B.navy, marginBottom:4 },
  pawSub:      { fontSize:13, color:B.sub, lineHeight:1.5 },
  pawBtn:      { background:"linear-gradient(135deg,#B8874F,#D4A373)", color:B.plum, border:"none", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, flexShrink:0, fontFamily:B.ff },
  shareBtn:    { width:"100%", background:B.white, color:B.plum, border:"2px solid #B8874F", borderRadius:16, padding:"15px 24px", fontSize:15, fontWeight:700, boxShadow:"0 2px 10px rgba(11,77,55,0.08)" },
  dis:         { fontSize:11, color:B.muted, lineHeight:1.7, padding:"14px 16px", background:B.white, borderRadius:14, border:`1px solid ${B.border}` },
  footer:      { textAlign:"center", paddingTop:8 },
};
