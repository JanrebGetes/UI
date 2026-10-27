(function(){
"use strict";

/* ===== DATA: menu items. `custom` items open the customizer; others add straight to the cart ===== */
const MENU=[
  {id:1,name:"Classic Chicken Shawarma",cat:"Wraps",price:189,emoji:"🌯",tag:"Bestseller",custom:true,desc:"Spit-roasted chicken, garlic sauce, pickles and tomato in warm pita."},
  {id:2,name:"Beef Shawarma",cat:"Wraps",price:219,emoji:"🥙",custom:true,desc:"Juicy shaved beef with tahini, onion and parsley."},
  {id:3,name:"Mixed Deluxe Shawarma",cat:"Wraps",price:249,emoji:"🌯",tag:"Signature",custom:true,desc:"Chicken and beef together, with fries rolled inside."},
  {id:4,name:"Falafel Veggie Wrap",cat:"Wraps",price:169,emoji:"🧆",custom:true,desc:"Crisp falafel, hummus, cucumber and pickled turnip."},
  {id:5,name:"Chicken Rice Plate",cat:"Plates",price:259,emoji:"🍛",custom:true,desc:"Sliced chicken over buttered rice with salad and sauce."},
  {id:6,name:"Beef Rice Plate",cat:"Plates",price:289,emoji:"🍛",custom:true,desc:"Shaved beef over spiced rice, grilled tomato and pita."},
  {id:7,name:"Garlic Fries",cat:"Sides",price:99,emoji:"🍟",desc:"Crispy fries tossed in toum and parsley."},
  {id:8,name:"Hummus and Pita",cat:"Sides",price:139,emoji:"🫓",desc:"Creamy chickpea hummus with olive oil and warm pita."},
  {id:9,name:"Tabbouleh",cat:"Sides",price:119,emoji:"🥗",desc:"Parsley, tomato, bulgur and lemon."},
  {id:10,name:"Mint Lemonade",cat:"Drinks",price:89,emoji:"🍋",tag:"Cold",desc:"Fresh lemon blended with mint and ice."},
  {id:11,name:"Ayran",cat:"Drinks",price:79,emoji:"🥛",desc:"Salty chilled yogurt drink."},
  {id:12,name:"Iced Tea",cat:"Drinks",price:69,emoji:"🧊",desc:"Black tea with a squeeze of lemon."}
];
/* Options offered in the customizer. `p` is the price added. */
const SIZES=[{n:"Regular",p:0},{n:"Large",p:40}];
const SAUCES=["Garlic","Chili","Tahini","Half and half"];
const EXTRAS=[{n:"Extra meat",p:50},{n:"Cheese",p:30},{n:"Pickles",p:10},{n:"Fries inside",p:30}];
const FEE=49, FREE_OVER=500; // delivery fee in pesos, waived above this subtotal

/* ===== HELPERS ===== */
const $=s=>document.querySelector(s);
const peso=n=>"₱"+n.toLocaleString("en-PH");
const find=id=>MENU.find(m=>m.id===id);
/* price of one unit of a cart line = base + size + extras */
const unit=l=>find(l.id).price+SIZES[l.size].p+l.extras.reduce((s,i)=>s+EXTRAS[i].p,0);

/* ===== CART STATE (kept in localStorage when available, wrapped in try/catch) ===== */
let cart=[];
try{cart=JSON.parse(localStorage.getItem("ds-cart")||"[]")}catch(e){cart=[]}
const save=()=>{try{localStorage.setItem("ds-cart",JSON.stringify(cart))}catch(e){}};

/* ===== MENU RENDERING ===== */
const cats=["All",...new Set(MENU.map(m=>m.cat))];
let active="All";

function renderChips(){
  $("#chips").innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===active}" data-cat="${c}">${c}</button>`).join("");
}
function renderMenu(){
  const list=MENU.filter(m=>active==="All"||m.cat===active);
  /* staggered delay makes cards spring in one after another */
  $("#grid").innerHTML=list.map((m,i)=>`
    <article class="card pop" style="animation-delay:${i*45}ms">
      <div class="pic">${m.tag?`<span class="tag">${m.tag}</span>`:""}${m.emoji}</div>
      <div class="body"><h3>${m.name}</h3><p>${m.desc}</p>
        <div class="row"><span class="price">${peso(m.price)}</span>
        <button class="add" data-id="${m.id}">${m.custom?"Customize":"Add"}</button></div>
      </div></article>`).join("");
}
$("#chips").addEventListener("click",e=>{
  const b=e.target.closest("[data-cat]"); if(!b) return;
  active=b.dataset.cat; renderChips(); renderMenu();
});
$("#grid").addEventListener("click",e=>{
  const b=e.target.closest(".add"); if(!b) return;
  const m=find(+b.dataset.id);
  m.custom?openCustom(m):addLine({id:m.id,size:0,sauce:0,extras:[],qty:1});
});

/* ===== CUSTOMIZE DIALOG ===== */
function openCustom(m){
  const dlg=$("#dlg"), body=$("#dlgBody");
  body.innerHTML=`
    <h3 id="dTitle">${m.emoji} ${m.name}</h3>
    <fieldset><legend>Size</legend><div class="opts">${SIZES.map((s,i)=>`<label><input type="radio" name="size" value="${i}" ${i===0?"checked":""}><span>${s.n}${s.p?` +${peso(s.p)}`:""}</span></label>`).join("")}</div></fieldset>
    <fieldset><legend>Sauce</legend><div class="opts">${SAUCES.map((s,i)=>`<label><input type="radio" name="sauce" value="${i}" ${i===0?"checked":""}><span>${s}</span></label>`).join("")}</div></fieldset>
    <fieldset><legend>Extras</legend><div class="opts">${EXTRAS.map((x,i)=>`<label><input type="checkbox" name="extra" value="${i}"><span>${x.n} +${peso(x.p)}</span></label>`).join("")}</div></fieldset>
    <button class="btn" id="dAdd"></button>
    <button class="btn ghost" id="dCancel">Cancel</button>`;
  /* read the current choices from the form */
  const read=()=>({
    id:m.id, qty:1,
    size:+body.querySelector("[name=size]:checked").value,
    sauce:+body.querySelector("[name=sauce]:checked").value,
    extras:[...body.querySelectorAll("[name=extra]:checked")].map(x=>+x.value)
  });
  /* keep the button price live as options change */
  const refresh=()=>{$("#dAdd").textContent="Add to order · "+peso(unit(read()))};
  body.addEventListener("change",refresh); refresh();
  $("#dAdd").onclick=()=>{addLine(read()); dlg.close()};
  $("#dCancel").onclick=()=>dlg.close();
  dlg.showModal();
}
/* clicking the dark backdrop closes the dialog */
$("#dlg").addEventListener("click",e=>{if(e.target===e.currentTarget) e.currentTarget.close()});

/* ===== CART LOGIC ===== */
const lineKey=l=>[l.id,l.size,l.sauce,l.extras.join(".")].join("|");
function addLine(l){
  const hit=cart.find(c=>lineKey(c)===lineKey(l));
  hit?hit.qty++:cart.push(l);
  save(); renderCart();
  toast(find(l.id).name+" added");
  const b=$("#badge"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); // restart the bump animation
}
function renderCart(){
  const count=cart.reduce((s,l)=>s+l.qty,0);
  const sub=cart.reduce((s,l)=>s+unit(l)*l.qty,0);
  const fee=!cart.length||sub>=FREE_OVER?0:FEE;
  $("#badge").textContent=count;
  $("#lines").innerHTML=cart.length?cart.map((l,i)=>{
    const m=find(l.id);
    const detail=m.custom?`${SIZES[l.size].n}, ${SAUCES[l.sauce]} sauce${l.extras.length?", "+l.extras.map(x=>EXTRAS[x].n).join(", "):""}`:"";
    return `<div class="line"><div class="e">${m.emoji}</div>
      <div><b>${m.name}</b><small>${detail}</small>
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Remove one">−</button><span>${l.qty}</span><button data-i="${i}" data-d="1" aria-label="Add one">+</button></div></div>
      <b>${peso(unit(l)*l.qty)}</b></div>`}).join("")
    :`<div class="empty"><div class="big">🌯</div><p>Your cart is empty. Pick something from the menu.</p><button class="btn" id="browse">Browse the menu</button></div>`;
  $("#foot").hidden=!cart.length;
  $("#sub").textContent=peso(sub);
  $("#fee").textContent=fee?peso(fee):"Free";
  $("#tot").textContent=$("#tot2").textContent=peso(sub+fee);
  /* free-delivery progress bar animates via the width transition */
  $("#meter").style.width=Math.min(100,sub/FREE_OVER*100)+"%";
  $("#meterTxt").textContent=sub>=FREE_OVER?"You’ve unlocked free delivery.":`Add ${peso(FREE_OVER-sub)} more for free delivery.`;
}
$("#lines").addEventListener("click",e=>{
  if(e.target.id==="browse"){closeCart();location.hash="menu";return}
  const b=e.target.closest("[data-i]"); if(!b) return;
  const l=cart[+b.dataset.i]; l.qty+=+b.dataset.d;
  if(l.qty<1) cart.splice(+b.dataset.i,1);
  save(); renderCart();
});

/* ===== DRAWER OPEN / CLOSE + VIEW SWITCHING ===== */
function view(v){
  $("#vCart").hidden=v!=="cart"; $("#vCheckout").hidden=v!=="checkout"; $("#vDone").hidden=v!=="done";
  $("#dTitleCart").textContent={cart:"Your order",checkout:"Delivery details",done:"Order placed"}[v];
}
function openCart(){view("cart");$("#drawer").classList.add("on");$("#veil").classList.add("on");$("#drawer").setAttribute("aria-hidden","false")}
function closeCart(){$("#drawer").classList.remove("on");$("#veil").classList.remove("on");$("#drawer").setAttribute("aria-hidden","true")}
$("#cartBtn").onclick=openCart; $("#closeCart").onclick=closeCart; $("#veil").onclick=closeCart;
document.addEventListener("keydown",e=>{if(e.key==="Escape") closeCart()});
$("#toCheckout").onclick=()=>view("checkout");
$("#back").onclick=()=>view("cart");

/* ===== CHECKOUT: validate, show confirmation, then animate a pretend tracker ===== */
let timer;
$("#form").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("#fName").value.trim().split(" ")[0]; // textContent below keeps user input safe
  $("#doneTitle").textContent=`Thanks, ${name}! Order #SH-${Math.floor(1000+Math.random()*9000)}`;
  $("#doneSub").textContent="Your shawarma is on its way to the spit. Estimated arrival: 30 to 40 minutes.";
  cart=[]; save(); renderCart(); view("done");
  const steps=[...document.querySelectorAll("#steps li")]; steps.forEach(s=>s.classList.remove("on"));
  let n=0; clearInterval(timer);
  timer=setInterval(()=>{ if(n<steps.length){steps[n++].classList.add("on")} else clearInterval(timer) },1400);
});
$("#again").onclick=()=>{$("#form").reset();closeCart();location.hash="menu"};

/* ===== TOAST ===== */
let tt;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("on");
  clearTimeout(tt); tt=setTimeout(()=>t.classList.remove("on"),1800);
}

/* ===== HERO SPIT: tap toggles a faster spin (hover is handled in CSS) ===== */
$("#spit").onclick=()=>$("#spit").classList.toggle("fast");

/* ===== INIT ===== */
renderChips(); renderMenu(); renderCart();
})();
