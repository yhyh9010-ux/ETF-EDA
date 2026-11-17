const CATEGORIES = {1:'국내 시장지수',2:'국내 업종·테마',3:'국내 파생',4:'해외 주식',5:'원자재',6:'채권',7:'기타'};
// The API has no issuer field; infer it from the first word of each product name.
const BRANDS = {KODEX:'삼성자산운용',TIGER:'미래에셋자산운용',ACE:'한국투자신탁운용',KINDEX:'한국투자신탁운용',RISE:'KB자산운용',KBSTAR:'KB자산운용',SOL:'신한자산운용',PLUS:'한화자산운용',ARIRANG:'한화자산운용',KIWOOM:'키움투자자산운용',KOSEF:'키움투자자산운용','히어로즈':'키움투자자산운용','1Q':'하나자산운용',KTOP:'하나자산운용',TIMEFOLIO:'타임폴리오자산운용',TIME:'타임폴리오자산운용',HANARO:'NH-Amundi자산운용',BNK:'BNK자산운용',FOCUS:'브이아이자산운용',WOORI:'우리자산운용',WON:'우리자산운용','마이티':'DB자산운용',KOACT:'삼성액티브자산운용','에셋플러스':'에셋플러스자산운용',IBK:'IBK자산운용',MIDAS:'마이다스에셋자산운용','파워':'교보악사자산운용',HK:'흥국자산운용',UNICORN:'현대자산운용',DAISHIN:'대신자산운용',DS:'DS자산운용',TRUSTON:'트러스톤자산운용',KCGI:'KCGI자산운용'};
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('ko-KR');
const pf=new Intl.NumberFormat('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2});
const n=value=>Number(value)||0;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=value=>value>=10000?`${pf.format(value/10000)}조 원`:`${nf.format(Math.round(value))}억 원`;
const rate=value=>`${value>0?'+':''}${pf.format(value)}%`;
const polarity=value=>value>0?'positive':value<0?'negative':'';
const state={items:[],query:'',issuer:'',market:'',sort:'marketSum-desc',page:1,mover:'up',loading:false};
const PAGE_SIZE=20;

function normalize(raw){
  const itemname=String(raw.itemname??'');
  const brand=itemname.trim().split(/\s+/)[0].toUpperCase();
  return {...raw,itemcode:String(raw.itemcode??''),itemname,issuer:BRANDS[brand]||'미분류',category:CATEGORIES[Number(raw.etfTabCode)]||'기타',nowVal:n(raw.nowVal),changeVal:n(raw.changeVal),changeRate:n(raw.changeRate),threeMonthEarnRate:raw.threeMonthEarnRate==null||raw.threeMonthEarnRate===''?null:Number(raw.threeMonthEarnRate),nav:raw.nav==null||raw.nav===''?null:Number(raw.nav),marketSum:n(raw.marketSum),quant:n(raw.quant)};
}
function groupBy(key){
  const groups=new Map();
  for(const item of state.items){const label=item[key];const group=groups.get(label)||{label,count:0,marketSum:0};group.count++;group.marketSum+=item.marketSum;groups.set(label,group);}
  return [...groups.values()].sort((a,b)=>b.marketSum-a.marketSum);
}
function renderMetrics(){
  const items=state.items,total=items.reduce((s,item)=>s+item.marketSum,0),up=items.filter(x=>x.changeRate>0).length,down=items.filter(x=>x.changeRate<0).length,avg=items.length?items.reduce((s,x)=>s+x.changeRate,0)/items.length:0;
  $('metric-count').textContent=nf.format(items.length);
  $('metric-cap').textContent=cap(total);
  $('metric-direction').innerHTML=`<span class="positive">${nf.format(up)}</span><span style="font-size:17px;color:#aebcbb;margin:0 6px">/</span><span class="negative">${nf.format(down)}</span>`;
  $('metric-return').textContent=rate(avg);$('metric-return').className=polarity(avg);
}
function renderMarkets(){
  const groups=groupBy('category'),max=groups[0]?.marketSum||1;
  $('market-bars').innerHTML=groups.map(x=>`<div class="bar-item"><span class="bar-label" title="${esc(x.label)}">${esc(x.label)}</span><div class="bar-track" role="img" aria-label="${esc(x.label)} ${esc(cap(x.marketSum))}"><div class="bar-fill" style="width:${Math.max(2,x.marketSum/max*100)}%"></div></div><span class="bar-value">${cap(x.marketSum)}<small>${nf.format(x.count)}개 상품</small></span></div>`).join('')||'<div class="empty-row">시장 데이터가 없습니다.</div>';
}
function renderMovers(){
  const up=state.mover==='up';
  const items=state.items.filter(x=>up?x.changeRate>0:x.changeRate<0).sort((a,b)=>up?b.changeRate-a.changeRate:a.changeRate-b.changeRate).slice(0,5);
  $('movers').innerHTML=items.map((x,i)=>`<button class="mover" data-code="${esc(x.itemcode)}" type="button"><span class="mover-rank">${i+1}</span><span class="mover-main"><span class="mover-name">${esc(x.itemname)}</span><span class="mover-code">${esc(x.itemcode)}</span></span><span class="mover-rate ${polarity(x.changeRate)}">${rate(x.changeRate)}</span></button>`).join('')||'<div class="empty-row">해당 상품이 없습니다.</div>';
  document.querySelectorAll('[data-mover]').forEach(b=>b.classList.toggle('selected',b.dataset.mover===state.mover));
}
function renderIssuers(){
  const groups=groupBy('issuer');$('issuer-count').textContent=`${nf.format(groups.length)}개 운용사·분류`;
  $('issuer-list').innerHTML=groups.slice(0,10).map((x,i)=>`<button class="issuer-row" data-issuer="${esc(x.label)}" type="button" title="${esc(x.label)} 상품 보기"><span class="issuer-rank">${String(i+1).padStart(2,'0')}</span><span><span class="issuer-name">${esc(x.label)}</span><span class="issuer-meta">${nf.format(x.count)}개</span></span><span class="issuer-value">${cap(x.marketSum)}</span></button>`).join('')||'<div class="empty-row">운용사 데이터가 없습니다.</div>';
}
function updateFilters(){
  const issuers=groupBy('issuer').map(x=>x.label).sort((a,b)=>a.localeCompare(b,'ko'));
  $('issuer-filter').innerHTML='<option value="">전체 운용사</option>'+issuers.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('market-filter').innerHTML='<option value="">전체 시장</option>'+[...new Set(state.items.map(x=>x.category))].map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('issuer-filter').value=state.issuer;$('market-filter').value=state.market;
}
function filteredItems(){
  const q=state.query.trim().toLocaleLowerCase('ko');
  const list=state.items.filter(x=>(!q||x.itemname.toLocaleLowerCase('ko').includes(q)||x.itemcode.includes(q))&&(!state.issuer||x.issuer===state.issuer)&&(!state.market||x.category===state.market));
  const [field,order]=state.sort.split('-');
  list.sort((a,b)=>(order==='desc'?-1:1)*(field==='itemname'?a.itemname.localeCompare(b.itemname,'ko'):n(a[field])-n(b[field]))||a.itemname.localeCompare(b.itemname,'ko'));
  return list;
}
function renderProducts(){
  const items=filteredItems(),pages=Math.max(1,Math.ceil(items.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
  const start=(state.page-1)*PAGE_SIZE;
  $('result-count').textContent=`${nf.format(items.length)}개 상품 검색 결과`;
  $('product-rows').innerHTML=items.slice(start,start+PAGE_SIZE).map(x=>`<tr><td><span class="product-name">${esc(x.itemname)}</span><span class="product-code">${esc(x.itemcode)}</span></td><td><span class="tag">${esc(x.issuer)}</span></td><td><span class="tag category-tag">${esc(x.category)}</span></td><td class="num">${nf.format(x.nowVal)}원</td><td class="num ${polarity(x.changeRate)}">${rate(x.changeRate)}</td><td class="num ${polarity(x.threeMonthEarnRate)}">${x.threeMonthEarnRate==null||!Number.isFinite(x.threeMonthEarnRate)?'—':rate(x.threeMonthEarnRate)}</td><td class="num">${cap(x.marketSum)}</td><td class="num">${nf.format(x.quant)}</td><td><button type="button" class="row-detail" data-code="${esc(x.itemcode)}" aria-label="${esc(x.itemname)} 상세 보기">›</button></td></tr>`).join('')||'<tr><td colspan="9" class="empty-row">검색 조건에 맞는 상품이 없습니다.</td></tr>';
  $('page-info').textContent=`${nf.format(items.length)}개 중 ${items.length?nf.format(start+1):0}–${nf.format(Math.min(start+PAGE_SIZE,items.length))}개 표시`;
  $('page-number').textContent=`${state.page} / ${pages}`;$('prev-page').disabled=state.page<=1;$('next-page').disabled=state.page>=pages;
}
function renderAll(){renderMetrics();renderMarkets();renderMovers();renderIssuers();updateFilters();renderProducts();}
function openDetail(code){
  const x=state.items.find(item=>item.itemcode===code);if(!x)return;
  $('detail-content').innerHTML=`<div class="detail-body"><h2 id="detail-title">${esc(x.itemname)}</h2><div class="detail-code">종목코드 ${esc(x.itemcode)} · ${esc(x.category)}</div><div class="detail-price"><strong>${nf.format(x.nowVal)}원</strong><span class="${polarity(x.changeRate)}">${rate(x.changeRate)}</span></div><div class="detail-grid"><div><span>운용사 추정</span><strong>${esc(x.issuer)}</strong></div><div><span>시가총액</span><strong>${cap(x.marketSum)}</strong></div><div><span>3개월 수익률</span><strong class="${polarity(x.threeMonthEarnRate)}">${x.threeMonthEarnRate==null||!Number.isFinite(x.threeMonthEarnRate)?'—':rate(x.threeMonthEarnRate)}</strong></div><div><span>거래량</span><strong>${nf.format(x.quant)}주</strong></div><div><span>NAV</span><strong>${x.nav==null||!Number.isFinite(x.nav)?'—':nf.format(x.nav)+'원'}</strong></div><div><span>전일 대비</span><strong class="${polarity(x.changeVal)}">${x.changeVal>0?'+':''}${nf.format(x.changeVal)}원</strong></div></div><a class="detail-link" href="https://finance.naver.com/item/main.naver?code=${encodeURIComponent(x.itemcode)}" target="_blank" rel="noopener noreferrer">네이버 금융에서 자세히 보기 ↗</a><p class="detail-note">운용사는 상품명 브랜드로 추정한 값입니다. 시세 및 수익률은 네이버 금융 ETF 목록 API에서 제공한 값을 표시합니다.</p></div>`;
  $('detail-dialog').showModal();
}
function showStatus(message){$('status-message').textContent=message;$('status-message').hidden=!message;}
function fetchEtfs(){
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    let finished=false;
    const timer=setTimeout(()=>finish(new Error('네이버 금융 응답 시간이 초과되었습니다.')),12000);
    function finish(error,items){
      if(finished)return;
      finished=true;clearTimeout(timer);script.remove();delete window.__etfAtlasCb;
      if(error)reject(error);else resolve(items);
    }
    window.__etfAtlasCb=payload=>{
      const items=payload?.result?.etfItemList;
      if(payload?.resultCode!=='success'||!Array.isArray(items))finish(new Error('네이버 ETF 응답 형식이 예상과 다릅니다.'));
      else finish(null,items);
    };
    script.charset='euc-kr';
    script.async=true;
    script.onerror=()=>finish(new Error('네이버 금융에 연결하지 못했습니다.'));
    script.src=`https://finance.naver.com/api/sise/etfItemList.nhn?_callback=window.__etfAtlasCb&_=${Date.now()}`;
    document.head.append(script);
  });
}
async function loadData(){
  if(state.loading)return;state.loading=true;$('refresh-button').disabled=true;
  try{
    const items=await fetchEtfs();
    state.items=items.map(normalize).filter(x=>x.itemcode&&x.itemname);
    $('update-time').textContent=`최종 조회 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
    showStatus('');renderAll();
  }catch(error){showStatus(`${error.message} ${state.items.length?'이전 조회 결과를 표시하고 있습니다.':'서버 연결과 네이버 금융 응답을 확인해 주세요.'}`);if(!state.items.length)$('product-rows').innerHTML='<tr><td colspan="9" class="empty-row">ETF 데이터를 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.</td></tr>';}
  finally{state.loading=false;$('refresh-button').disabled=false;}
}
$('search').addEventListener('input',e=>{state.query=e.target.value;state.page=1;renderProducts();});
$('issuer-filter').addEventListener('change',e=>{state.issuer=e.target.value;state.page=1;renderProducts();});
$('market-filter').addEventListener('change',e=>{state.market=e.target.value;state.page=1;renderProducts();});
$('sort-filter').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;renderProducts();});
$('prev-page').addEventListener('click',()=>{state.page--;renderProducts();});
$('next-page').addEventListener('click',()=>{state.page++;renderProducts();});
$('refresh-button').addEventListener('click',loadData);
$('close-detail').addEventListener('click',()=>$('detail-dialog').close());
$('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog'))$('detail-dialog').close();});
document.addEventListener('click',e=>{const mover=e.target.closest('[data-mover]');if(mover){state.mover=mover.dataset.mover;renderMovers();}const product=e.target.closest('[data-code]');if(product)openDetail(product.dataset.code);const issuer=e.target.closest('[data-issuer]');if(issuer){state.issuer=issuer.dataset.issuer;state.page=1;$('issuer-filter').value=state.issuer;renderProducts();$('products').scrollIntoView({behavior:'smooth'});}});
document.querySelectorAll('.side-nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.side-nav a').forEach(x=>x.classList.remove('active'));link.classList.add('active');}));
loadData();setInterval(loadData,30000);
