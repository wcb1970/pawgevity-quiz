import { useState, useEffect, useRef } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const B = {
  olive:  "#685820", oliveM: "#8B7A2E", oliveL: "#F5EFD9",
  forest: "#0B4D37", forestM:"#156B4F", forestL:"#E8F4EF",
  cream:  "#FAF7F1", warm:   "#F3EDE3",
  navy:   "#0D1B14", text:   "#1C2B22", sub:    "#4A6355", muted:  "#7A9088",
  border: "#DDE6E1", white:  "#FFFFFF",
  coral:  "#C0391A", coralL: "#FAEAE6",
  gold:   "#B07820", goldL:  "#FAF3E0",
  teal:   "#0B7490", tealL:  "#E5F6FA",
  plum:   "#5B35A0", plumL:  "#F0EBFA",
  ff:     "'Fraunces', serif",
  fn:     "'Outfit', sans-serif",
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
    sub:"Age is one of the strongest indicators of which wellness areas need the most support.",
    emoji:"📅",
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
    sub:"Most owners focus on one obvious thing — but the data shows the real issue is usually something else.",
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
    sub:"Tick the one that feels most familiar — even if it seems minor.",
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
    sub:"This helps us tailor whether your report should flag anything for your next appointment.",
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

// ─── PILLAR MAP ───────────────────────────────────────────────────────────────
const PILLAR_COLORS = {
  "Joint & Mobility":   { color:B.forest,  bg:B.forestL, icon:"🦴" },
  "Skin & Coat":        { color:B.gold,    bg:B.goldL,   icon:"✨" },
  "Gut & Immune":       { color:B.teal,    bg:B.tealL,   icon:"🛡️" },
  "Brain & Cognitive":  { color:B.plum,    bg:B.plumL,   icon:"🧠" },
  "Inflammation":       { color:B.coral,   bg:B.coralL,  icon:"🔥" },
  "General Wellness":   { color:B.forest,  bg:B.forestL, icon:"🐾" },
};

const MYTHS = {
  joint:  { myth:"Most owners assume stiffness is just aging.",   truth:"It's usually the earliest sign of joint inflammation — and one of the most manageable when caught at this stage." },
  coat:   { myth:"Most owners treat coat issues with shampoos.",  truth:"Coat condition almost always reflects what's happening internally. External products address the symptom, not the cause." },
  gut:    { myth:"Most owners see appetite changes as 'pickiness.'", truth:"Inconsistent appetite is one of the most reliable early signals of gut microbiome shifts — which affect immunity, energy, and mood." },
  brain:  { myth:"Most owners attribute cognitive changes to 'getting older.'", truth:"Early behavioral shifts often appear 6–12 months before noticeable decline. The window for meaningful intervention is now." },
  inflam: { myth:"Most owners assume their dog would show pain more obviously.", truth:"Dogs instinctively mask discomfort. Restlessness and position-shifting are often the only observable signs of chronic low-level inflammation." },
  unsure: { myth:"Most owners who aren't sure yet have already noticed something.", truth:"The fact that you're here means your instincts are working. Something small has likely already shifted — and that's exactly the right time to look." },
};

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
        <div style={{fontFamily:B.fn,fontWeight:800,fontSize:19,color:c,letterSpacing:"-0.02em",lineHeight:1}}>pawgevity</div>
        <div style={{fontFamily:B.fn,fontWeight:500,fontSize:10,color:s,marginTop:2,letterSpacing:"0.05em",textTransform:"uppercase"}}>Wellness Profile</div>
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
      <nav style={l.nav}>
        <Logo light/>
        <div style={l.navPill}>Free · Takes 90 seconds</div>
      </nav>

      <div style={{...l.hero, opacity:v?1:0, transform:v?"none":"translateY(24px)", transition:"all 0.7s cubic-bezier(0.34,1.1,0.64,1)"}}>
        <div style={l.badge}>
          <span style={l.dot}/>
          <span>47,000+ dog wellness profiles built</span>
        </div>

        <h1 style={l.h1}>
          Build your dog's<br/>
          <em style={l.em}>personalized wellness profile.</em>
        </h1>

        <p style={l.p}>
          Answer 6 questions about your dog and we'll identify which of the 5 key health areas need the most attention right now — and what to do about it. Free, takes 90 seconds.
        </p>

        {/* The Scratch-style myth hook */}
        <div style={l.mythCard}>
          <div style={l.mythLabel}>🔬 Did you know?</div>
          <p style={l.mythText}>
            <strong>91% of dog owners who complete this profile discover an area they weren't monitoring.</strong> The most common is the one their dog shows the fewest obvious signs of.
          </p>
        </div>

        <div style={l.stats}>
          {[{n:"6",l:"Questions"},{n:"90 sec",l:"To complete"},{n:"5",l:"Health areas checked"}].map((s,i)=>(
            <div key={i} style={l.stat}>
              <div style={l.statN}>{s.n}</div>
              <div style={l.statL}>{s.l}</div>
            </div>
          ))}
        </div>

        <button style={l.cta} onClick={onStart}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          Build My Dog's Profile →
        </button>
        <p style={l.ctaNote}>Free · No credit card · 90 seconds</p>
        <div style={l.trust}>
          {["✓ Based on veterinary wellness research","✓ Personalized to your dog's breed and age","✓ Specific — not generic advice"].map((t,i)=>(
            <div key={i} style={l.trustItem}>{t}</div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={{...l.quotes, opacity:v?1:0, transition:"opacity 1.1s ease 0.5s"}}>
        {[
          {name:"Sandra M.", loc:"Sacramento, CA", q:"I genuinely didn't know Bella's coat issues were pointing to something internal. This changed how I think about her health.", s:5},
          {name:"Mrs. Jean T.", loc:"Atlanta, GA", q:"Rudy had been slowing down for months. I thought it was just age. This showed me it was something I could actually help with.", s:5},
          {name:"Lisa K.", loc:"Chicago, IL", q:"The profile was so specific to Louie — not generic advice like 'give him fish oil.' Real, actionable information.", s:5},
        ].map((t,i)=>(
          <div key={i} style={l.qCard}>
            <div style={l.stars}>{"★".repeat(t.s)}</div>
            <p style={l.qText}>"{t.q}"</p>
            <div style={l.qMeta}>{t.name} · {t.loc}</div>
          </div>
        ))}
      </div>
      <div style={l.dis}>For informational purposes only. Not veterinary advice. Consult your veterinarian for your dog's health. † Not evaluated by the FDA.</div>
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
      {/* Top bar */}
      <div style={q.topBar}>
        <Logo size={28}/>
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
                  ...(isSel   ? {borderColor:B.forest,background:B.forestL,transform:"scale(1.01)"} : {}),
                  ...(isOther ? {opacity:0.3,transform:"scale(0.97)"} : {}),
                  transition:"all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                }} onClick={()=>selectChoice(c,i)} disabled={selected!==null}>
                  <span style={{fontSize:22,flexShrink:0}}>{c.icon}</span>
                  <span style={{fontSize:15,fontWeight:isSel?700:500,color:isSel?B.forest:B.text,flex:1,textAlign:"left",lineHeight:1.4}}>
                    {c.label}
                  </span>
                  {isSel && <div style={{...q.check,background:B.forest}}>✓</div>}
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
            <p style={q.mythTruth}><strong>What's actually happening:</strong> {myth.truth}</p>
            <button
              style={{
                width:"100%", background:"#0B4D37", color:"#fff", border:"none",
                borderRadius:14, padding:"16px 24px", fontSize:16, fontWeight:700,
                cursor:"pointer", fontFamily:"'Outfit',sans-serif", marginTop:4
              }}
              onClick={dismissMyth}
            >
              Got it — continue building {data.name}'s profile →
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
    `Analyzing ${data.name}'s breed profile…`,
    `Cross-referencing age-related wellness patterns…`,
    `Evaluating ${data.name}'s primary concern area…`,
    `Mapping to 5 wellness pillars…`,
    `Building personalized findings…`,
    `${data.name}'s profile is ready.`,
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
            <circle cx="60" cy="60" r="50" fill="none" stroke={B.forestL} strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke={B.forest} strokeWidth="8"
              strokeDasharray={`${(pct/100)*314} 314`} strokeLinecap="round"
              style={{transition:"stroke-dasharray 0.6s ease"}}/>
          </svg>
          <div style={calc.pct}>{pct}%</div>
        </div>

        <div style={calc.stepList}>
          {steps2.map((s,i)=>(
            <div key={i} style={{...calc.stepItem, opacity:step>=i?1:0.2, transition:`opacity 0.4s ease ${i*0.1}s`}}>
              <span style={{...calc.stepDot, background:step>=i?B.forest:B.border}}/>
              <span style={{fontSize:14, color:step>=i?B.text:B.muted, fontWeight:step===i?600:400}}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{...calc.pillarPill, background:PILLAR_COLORS[pillar]?.bg, color:PILLAR_COLORS[pillar]?.color, border:`1px solid ${PILLAR_COLORS[pillar]?.color}44`}}>
          {PILLAR_COLORS[pillar]?.icon} Primary focus: {pillar}
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
  const pillar = data.concern
    ? (STEPS[3].choices.find(c=>c.value===data.concern)?.pillar || "General Wellness")
    : "General Wellness";
  const pc = PILLAR_COLORS[pillar] || PILLAR_COLORS["General Wellness"];

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
                  attributes: {
                    email: email,
                    first_name: data.name || "",
                    properties: {
                      // Dog profile — all quiz answers as Klaviyo profile properties
                      dog_name:            data.name        || "",
                      dog_breed:           breedMap[data.breed]   || data.breed   || "",
                      dog_age:             ageMap[data.age]       || data.age     || "",
                      primary_concern:     concernMap[data.concern] || data.concern || "",
                      current_routine:     routineMap[data.routine] || data.routine || "",
                      observable_signal:   signalMap[data.signal]   || data.signal  || "",
                      last_vet_visit:      vetMap[data.vet]         || data.vet     || "",
                      // Source tracking
                      source:              "pawgevity_wellness_quiz",
                      quiz_completed_date: new Date().toISOString().split("T")[0],
                      // Flags for flow branching
                      has_supplement:      data.routine !== "none" ? "Yes" : "No",
                      vet_overdue:         (data.vet === "overdue" || data.vet === "long") ? "Yes" : "No",
                      dog_is_older:        (data.age === "senior2" || data.age === "senior3") ? "Yes" : "No",
                    }
                  }
                }
              },
              list_id: KLAVIYO_LIST_ID,
              custom_source: "Pawgevity Wellness Quiz",
            }
          }
        })
      });
    } catch(e) {
      // Silent fail — never block the user from seeing results
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
            <div style={g.previewSub}>6 questions analyzed · Profile complete</div>
          </div>
          <div style={g.previewCheck}>✓</div>
        </div>

        {/* Blurred cards */}
        <div style={g.blurWrap}>
          <div style={g.blurInner}>
            {["Primary wellness focus","Key finding for this age","Recommended action plan","Supplement guidance","Vet talking points"].map((item,i)=>(
              <div key={i} style={g.blurItem}>
                <div style={g.blurDot}/>
                <div style={{height:12, background:B.border, borderRadius:6, flex:1}}/>
              </div>
            ))}
          </div>
          <div style={g.blurOverlay}/>
          <div style={g.lockBadge}>
            <span>🔒</span>
            <span>Enter email to unlock {data.name}'s full profile</span>
          </div>
        </div>

        {/* Teaser — specific to their concern */}
        <div style={{...g.tease, borderColor:pc.color+"44", background:pc.bg}}>
          <span style={{fontSize:22}}>{pc.icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:pc.color,marginBottom:3}}>
              {pillar} is {data.name}'s primary area to address
            </div>
            <div style={{fontSize:13,color:B.sub,lineHeight:1.5}}>
              Your profile includes specific actions for this — plus all 5 health areas.
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={g.form}>
        <h2 style={g.formH}>Where should we send {data.name}'s profile?</h2>
        <p style={g.formP}>Enter your email and we'll show you the complete findings right now — plus a personalized action plan specific to {data.name}'s age, breed, and primary concern.</p>

        <label style={g.label}>Your email address</label>
        <input style={{...g.input,...(err?{borderColor:B.coral}:{})}} type="email"
          placeholder="yourname@email.com" value={email} autoFocus
          onChange={e=>{setEmail(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&!loading&&submit()}/>
        {err&&<p style={g.err}>{err}</p>}

        <button style={{...g.btn,opacity:valid?1:0.45}} onClick={submit} disabled={loading||!valid}>
          {loading
            ? <><span style={g.spin}/>Unlocking profile…</>
            : `See ${data.name}'s Full Profile →`}
        </button>
        <p style={g.fine}>Free · No spam · Unsubscribe anytime · By pawgevity™</p>
        <p style={g.dis}>† For informational purposes only. Not veterinary advice. Not evaluated by the FDA. Consult a licensed veterinarian for your dog's health concerns. Individual results may vary.</p>
      </div>
    </div>
  );
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function Results({ data, email }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVis(true),200); },[]);

  const pillar = data.concern
    ? (STEPS[3].choices.find(c=>c.value===data.concern)?.pillar || "General Wellness")
    : "General Wellness";
  const pc = PILLAR_COLORS[pillar];
  const myth = data.concern ? MYTHS[data.concern] : null;
  const ageGroup = data.age;
  const isYoung = ageGroup === "young" || ageGroup === "mid";
  const isOlder = ageGroup === "senior2" || ageGroup === "senior3";

  const ageInsight = isYoung
    ? `At ${data.age?.replace("young","under 5 years old").replace("mid","5–6 years old")}, you're in the ideal window to establish healthy baselines. Most health issues that show up at 8–10 years are preventable or manageable if addressed now.`
    : isOlder
    ? `At 9+ years, ${data.name}'s health is at the stage where weekly awareness matters most. Small changes are harder to attribute to specific causes without trend data — which is exactly why tracking now is valuable.`
    : `At 7–8 years, ${data.name} is entering the life stage where the most impactful preventive work happens. The decisions you make now have an outsized effect on the next 3–4 years.`;

  const routineInsight = {
    none:       `${data.name} isn't currently receiving any targeted supplement support. This is actually common — and it means there's meaningful room to improve what you're already doing.`,
    joint_supp: `You're already addressing joints, which is great. The question is whether it's covering all 5 pillars — joint supplements alone often miss the gut and inflammation pieces.`,
    multi:      `A multivitamin or probiotic is a solid foundation. The next layer is making sure it's specifically calibrated for ${data.name}'s age and primary concern area.`,
    rx:         `A vet-recommended diet is a strong base. The gap is usually in the non-prescription pillars — particularly inflammation and cognitive support for dogs over 7.`,
    multi_supp: `Multiple supplements can be effective — but they can also create gaps or redundancies. A single comprehensive formula often covers more reliably.`,
  }[data.routine] || `Your current routine is a good starting point.`;

  return (
    <div style={r.root}>
      {/* Header */}
      <div style={r.header}>
        <div style={r.headerNav}><Logo light/><div style={r.hBadge}>Wellness Profile</div></div>
        <div style={{...r.profileCard, opacity:vis?1:0, transform:vis?"none":"translateY(16px)", transition:"all 0.7s ease"}}>
          <div style={r.profileAvatar}>{data.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={r.profileName}>{data.name}</div>
            <div style={r.profileMeta}>{data.age?.replace("young","Under 5 yrs").replace("mid","5–6 yrs").replace("senior1","7–8 yrs").replace("senior2","9–10 yrs").replace("senior3","11+ yrs")} · {data.breed?.replace("retriever","Golden/Lab").replace("shepherd","German Shepherd").replace("bulldog","Pit Bull/Bulldog").replace("small","Small breed").replace("large","Large breed").replace("mixed","Mixed breed")}</div>
            <div style={r.profileTag}>Profile Complete ✓</div>
          </div>
        </div>
      </div>

      <div style={r.body}>

        {/* Primary finding */}
        <div style={{...r.findingCard, borderColor:pc.color, background:pc.bg}}>
          <div style={{...r.findingTag, background:pc.color}}>{pc.icon} Primary Focus Area</div>
          <h2 style={{...r.findingTitle, color:pc.color}}>{pillar}</h2>
          <p style={r.findingText}>
            Based on {data.name}'s age, breed, current routine, and the signals you've observed — <strong>{pillar}</strong> is the area that needs the most attention right now. This is where targeted support will have the biggest impact.
          </p>
          {myth && (
            <div style={r.mythBox}>
              <div style={{fontSize:13,fontWeight:700,color:pc.color,marginBottom:6}}>🔬 What you may not know yet</div>
              <p style={{fontSize:14,color:B.text,lineHeight:1.7}}>{myth.truth}</p>
            </div>
          )}
        </div>

        {/* Age insight */}
        <div style={r.card}>
          <div style={r.cardTitle}>📅 What {data.name}'s age means</div>
          <p style={r.cardText}>{ageInsight}</p>
        </div>

        {/* Routine insight */}
        <div style={r.card}>
          <div style={r.cardTitle}>💊 About {data.name}'s current routine</div>
          <p style={r.cardText}>{routineInsight}</p>
        </div>

        {/* All 5 pillars — status */}
        <div style={r.card}>
          <div style={r.cardTitle}>5-Pillar Overview</div>
          {Object.entries(PILLAR_COLORS).filter(([k])=>k!=="General Wellness").map(([name, pc2],i)=>{
            const isPrimary = name === pillar;
            const status = isPrimary ? "Primary focus" : i <= 1 ? "Monitor closely" : "Looking stable";
            const statusColor = isPrimary ? pc2.color : i <= 1 ? B.gold : B.forest;
            return (
              <div key={name} style={r.pillarRow}>
                <span style={{fontSize:18}}>{pc2.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:pc2.color}}>{name}</div>
                </div>
                <div style={{...r.statusChip,background:statusColor+"18",color:statusColor,border:`1px solid ${statusColor}44`}}>
                  {isPrimary?"⚠️":i<=1?"👁":"✓"} {status}
                </div>
              </div>
            );
          })}
        </div>

        {/* What's in your email */}
        <div style={r.emailCard}>
          <div style={r.emailTitle}>📧 What's in your inbox right now</div>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",marginBottom:16,lineHeight:1.6}}>
            We've sent {data.name}'s complete profile to <strong style={{color:"#fff"}}>{email}</strong>. Your email includes things this page doesn't show:
          </p>
          {[
            `A step-by-step action plan specific to ${data.name}'s ${pillar} focus area`,
            `The science behind what's driving each priority area`,
            "A simple 4-week care routine to start this week",
            "Targeted supplement guidance for this specific profile",
            "Vet conversation starters for your next appointment",
          ].map((item,i)=>(
            <div key={i} style={r.emailItem}>
              <span style={{color:"#7EDDB0",flexShrink:0}}>✓</span>
              <span style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>{item}</span>
            </div>
          ))}
        </div>

        {/* What to do next */}
        <div style={r.card}>
          <div style={r.cardTitle}>What to do right now</div>
          {[
            {n:"1",title:"Check your inbox",body:`Your personalized action plan for ${data.name} is waiting. The most important steps are in there — specific to what you just told us.`},
            {n:"2",title:"Track week over week with PawWatch",body:`A single profile tells you where things stand today. Weekly tracking shows the trend. PawWatch is free and takes 2 minutes a week.`},
            {n:"3",title:"Bring this to your vet",body:`Screenshot this profile or share it at your next appointment. Specific findings give your vet context they can't get from a routine exam alone.`},
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
          <div style={r.pawIcon}>📱</div>
          <div style={{flex:1}}>
            <div style={r.pawTitle}>Track {data.name} week over week</div>
            <div style={r.pawSub}>PawWatch gives you weekly check-ins, trend charts, and a vet-ready report. Free.</div>
          </div>
          <button style={r.pawBtn} onClick={()=>alert("Opens PawWatch app.")}>Open →</button>
        </div>

        {/* Share */}
        <button style={r.shareBtn} onClick={()=>{
          if(navigator.share){navigator.share({title:`${data.name}'s Wellness Profile`,text:`I just built a free wellness profile for ${data.name} with Pawgevity. See what areas need attention:`,url:"https://check.pawgevity.com"});}
          else{navigator.clipboard.writeText("https://check.pawgevity.com");alert("Link copied!");}
        }}>
          Share this with another dog owner 🔗
        </button>

        <div style={r.dis}>
          <strong>Disclaimer:</strong> This profile is for general informational purposes only and does not constitute veterinary medical advice, diagnosis, or treatment. Findings are wellness indicators — not clinical assessments. Always consult a licensed veterinarian for your dog's health. † These statements have not been evaluated by the Food and Drug Administration. Individual results may vary.
        </div>
        <div style={r.footer}>
          <span style={{fontFamily:B.fn,fontWeight:700,fontSize:13,color:B.muted}}>pawgevity™</span>
          <span style={{fontSize:11,color:B.border,marginLeft:8}}>· © {new Date().getFullYear()} Pawgevity · Results sent to {email}</span>
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:'Outfit',sans-serif;cursor:pointer;}
        input{font-family:'Outfit',sans-serif;}
        input:focus{outline:none;border-color:#0B4D37!important;box-shadow:0 0 0 3px rgba(11,77,55,0.1);}
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
  root:     { background:`linear-gradient(155deg,${B.forest} 0%,${B.forestM} 55%,#1F9E6E 100%)`, minHeight:"100vh", padding:"0 0 48px", position:"relative", overflow:"hidden" },
  bg1:      { position:"absolute", top:-100, right:-100, width:360, height:360, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" },
  bg2:      { position:"absolute", bottom:-60, left:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" },
  nav:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px" },
  navPill:  { background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:100, padding:"6px 14px", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.9)" },
  hero:     { padding:"16px 24px 32px" },
  badge:    { display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:100, padding:"8px 16px", fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.95)", marginBottom:22 },
  dot:      { width:8, height:8, borderRadius:"50%", background:"#7EDDB0", display:"inline-block" },
  h1:       { fontFamily:B.ff, fontSize:"clamp(28px,7vw,42px)", fontWeight:700, color:"#fff", lineHeight:1.2, marginBottom:16 },
  em:       { display:"block", fontStyle:"italic", color:"#A8F0CD" },
  p:        { fontSize:16, color:"rgba(255,255,255,0.82)", lineHeight:1.75, marginBottom:22, maxWidth:440 },
  mythCard: { background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:16, padding:"16px 18px", marginBottom:22 },
  mythLabel:{ fontSize:12, fontWeight:700, color:"#A8F0CD", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 },
  mythText: { fontSize:14, color:"rgba(255,255,255,0.9)", lineHeight:1.7 },
  stats:    { display:"flex", background:"rgba(255,255,255,0.1)", borderRadius:14, border:"1px solid rgba(255,255,255,0.15)", overflow:"hidden", marginBottom:22 },
  stat:     { flex:1, padding:"14px 10px", textAlign:"center", borderRight:"1px solid rgba(255,255,255,0.1)" },
  statN:    { fontFamily:B.ff, fontSize:22, fontWeight:700, color:"#fff", lineHeight:1 },
  statL:    { fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:4, lineHeight:1.3 },
  cta:      { display:"block", width:"100%", background:"#fff", color:B.forest, border:"none", borderRadius:16, padding:"20px 24px", fontSize:17, fontWeight:800, textAlign:"center", marginBottom:12, boxShadow:"0 8px 32px rgba(0,0,0,0.22)", letterSpacing:"-0.01em", transition:"transform 0.15s, box-shadow 0.15s" },
  ctaNote:  { textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:20 },
  trust:    { display:"flex", flexDirection:"column", gap:8, marginBottom:4 },
  trustItem:{ fontSize:14, color:"rgba(255,255,255,0.82)", fontWeight:500 },
  quotes:   { padding:"0 20px", display:"flex", flexDirection:"column", gap:12 },
  qCard:    { background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:16, padding:"18px 20px" },
  stars:    { color:"#FCD34D", fontSize:13, marginBottom:8, letterSpacing:2 },
  qText:    { fontSize:14, color:"rgba(255,255,255,0.9)", lineHeight:1.65, marginBottom:10, fontStyle:"italic" },
  qMeta:    { fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 },
  dis:      { fontSize:11, color:"rgba(255,255,255,0.35)", textAlign:"center", padding:"18px 24px 0", lineHeight:1.6 },
};

const q = {
  root:         { background:B.cream, minHeight:"100vh", display:"flex", flexDirection:"column" },
  topBar:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 22px 12px" },
  pill:         { background:B.white, border:`1px solid ${B.border}`, borderRadius:100, padding:"7px 14px", fontSize:13, fontWeight:700, color:B.muted },
  track:        { height:4, background:B.border, overflow:"hidden" },
  fill:         { height:"100%", background:`linear-gradient(90deg,${B.forest},${B.forestM})`, transition:"width 0.5s ease" },
  card:         { flex:1, padding:"16px 22px 40px" },
  emoji:        { fontSize:44, marginBottom:14, display:"block" },
  question:     { fontFamily:B.ff, fontSize:"clamp(20px,5vw,26px)", fontWeight:700, color:B.navy, lineHeight:1.3, marginBottom:12 },
  sub:          { fontSize:14, color:B.sub, lineHeight:1.65, marginBottom:22 },
  textWrap:     { display:"flex", flexDirection:"column", gap:12 },
  input:        { width:"100%", border:`2px solid ${B.border}`, borderRadius:14, padding:"17px 18px", fontSize:17, color:B.text, background:B.white, transition:"border-color 0.2s, box-shadow 0.2s" },
  nextBtn:      { background:B.forest, color:"#fff", border:"none", borderRadius:14, padding:"18px 24px", fontSize:17, fontWeight:700, boxShadow:`0 4px 20px rgba(11,77,55,0.22)` },
  choices:      { display:"flex", flexDirection:"column", gap:10 },
  choice:       { display:"flex", alignItems:"center", gap:14, padding:"16px 18px", background:B.white, border:`2px solid ${B.border}`, borderRadius:16, boxShadow:"0 1px 6px rgba(0,0,0,0.04)" },
  check:        { width:26, height:26, borderRadius:"50%", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:"up 0.2s ease" },
  mythOverlay:  { position:"fixed", inset:0, background:"rgba(11,77,55,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:"24px", backdropFilter:"blur(4px)" },
  mythCard:     { background:B.white, borderRadius:22, padding:"32px 26px", width:"100%", maxWidth:440, animation:"mythIn 0.35s cubic-bezier(0.34,1.2,0.64,1)" },
  mythHead:     { display:"flex", alignItems:"center", gap:10, marginBottom:16 },
  mythIcon:     { fontSize:24 },
  mythLabel2:   { fontSize:13, fontWeight:700, color:B.forest, textTransform:"uppercase", letterSpacing:"0.08em" },
  mythMythTxt:  { fontSize:15, color:B.muted, lineHeight:1.7, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${B.border}` },
  mythTruth:    { fontSize:16, color:B.text, lineHeight:1.75, marginBottom:18 },
  mythCont:     { fontSize:13, color:B.muted, textAlign:"center" },
};

const calc = {
  root:     { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", background:`linear-gradient(160deg,${B.cream},${B.warm})` },
  card:     { background:B.white, borderRadius:24, padding:"40px 28px", width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(11,77,55,0.1)", border:`1px solid ${B.border}`, textAlign:"center", marginTop:24, animation:"up 0.4s ease" },
  dogName:  { fontFamily:B.ff, fontSize:28, fontWeight:700, color:B.navy, lineHeight:1 },
  subHead:  { fontSize:14, color:B.muted, marginTop:6, marginBottom:28, letterSpacing:"0.04em", textTransform:"uppercase" },
  ringWrap: { position:"relative", width:120, height:120, margin:"0 auto 28px" },
  pct:      { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:B.ff, fontSize:26, fontWeight:700, color:B.forest },
  stepList: { display:"flex", flexDirection:"column", gap:12, marginBottom:24, textAlign:"left" },
  stepItem: { display:"flex", alignItems:"center", gap:10, transition:"opacity 0.4s ease" },
  stepDot:  { width:8, height:8, borderRadius:"50%", flexShrink:0, transition:"background 0.3s ease" },
  pillarPill:{ display:"inline-block", borderRadius:100, padding:"8px 18px", fontSize:13, fontWeight:700 },
};

const g = {
  root:       { background:`linear-gradient(160deg,${B.cream},${B.warm})`, minHeight:"100vh", padding:"24px 20px 48px" },
  preview:    { background:B.white, borderRadius:20, padding:"22px 20px", marginBottom:16, boxShadow:"0 4px 24px rgba(0,0,0,0.06)", border:`1px solid ${B.border}` },
  previewHead:{ display:"flex", alignItems:"center", gap:14, marginBottom:20 },
  previewAvatar:{ width:48, height:48, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:B.ff, fontSize:20, fontWeight:700, flexShrink:0 },
  previewName:{ fontFamily:B.ff, fontSize:18, fontWeight:700, color:B.navy },
  previewSub: { fontSize:13, color:B.muted, marginTop:2 },
  previewCheck:{ marginLeft:"auto", width:32, height:32, borderRadius:"50%", background:B.forestL, color:B.forest, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, flexShrink:0 },
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
  header:      { background:`linear-gradient(155deg,${B.forest},${B.forestM})`, padding:"20px 22px 28px" },
  headerNav:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 },
  hBadge:      { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:100, padding:"6px 14px", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.9)" },
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
  stepN:       { width:30, height:30, borderRadius:"50%", background:B.forestL, color:B.forest, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0, marginTop:2 },
  stepTitle:   { fontSize:15, fontWeight:700, color:B.navy, marginBottom:5 },
  stepBody:    { fontSize:13, color:B.sub, lineHeight:1.65 },
  pawCard:     { background:B.white, borderRadius:20, padding:"20px 20px", border:`1px solid ${B.border}`, boxShadow:"0 2px 16px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" },
  pawIcon:     { fontSize:30, flexShrink:0 },
  pawTitle:    { fontFamily:B.ff, fontSize:16, fontWeight:700, color:B.navy, marginBottom:4 },
  pawSub:      { fontSize:13, color:B.sub, lineHeight:1.5 },
  pawBtn:      { background:B.forest, color:"#fff", border:"none", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, flexShrink:0 },
  shareBtn:    { width:"100%", background:B.white, color:B.forest, border:`2px solid ${B.forest}`, borderRadius:16, padding:"15px 24px", fontSize:15, fontWeight:700, boxShadow:"0 2px 10px rgba(11,77,55,0.08)" },
  dis:         { fontSize:11, color:B.muted, lineHeight:1.7, padding:"14px 16px", background:B.white, borderRadius:14, border:`1px solid ${B.border}` },
  footer:      { textAlign:"center", paddingTop:8 },
};
