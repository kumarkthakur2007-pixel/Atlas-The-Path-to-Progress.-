/* ============================================================
   ANALYTICS
   ============================================================
   Purpose:   Cross-module charts — 7-day productivity, study
              hours, habit completion, expense split.
   Inputs:    none (reads from every other feature's data).
   Outputs:   Renders 4 charts into the Analytics page.
   Depends on: storage.js (userData), utils.js (safeChart).
   ============================================================ */
/* ============================================================
   ANALYTICS
   ============================================================ */
let anaCharts=[];
function renderAnalytics(){
  anaCharts.forEach(c=>{ if(c) c.destroy(); }); anaCharts=[];
  const ud=userData();
  const labels=[]; const prodData=[]; const studyData=[];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); labels.push(d.toLocaleDateString(undefined,{weekday:'short'}));
    prodData.push(ud.tasks.filter(t=>t.completedOn===key).length); studyData.push(ud.studyLog[key]||0); }
  anaCharts.push(safeChart(document.getElementById('anaProductivity'), {type:'bar', data:{labels, datasets:[{data:prodData, backgroundColor:'#6F9D24', borderRadius:8}]}, options:{plugins:{legend:{display:false}}}}));
  anaCharts.push(safeChart(document.getElementById('anaStudy'), {type:'line', data:{labels, datasets:[{data:studyData, borderColor:'#2F5F67', backgroundColor:'rgba(47,95,103,.1)', fill:true, tension:.4}]}, options:{plugins:{legend:{display:false}}}}));

  const habitLabels=ud.habits.map(h=>h.name);
  const habitPct=ud.habits.map(h=>{ let c=0; for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); if(h.days[d.toISOString().slice(0,10)]) c++; } return Math.round(c/7*100); });
  anaCharts.push(safeChart(document.getElementById('anaHabits'), {type:'bar', data:{labels:habitLabels, datasets:[{data:habitPct, backgroundColor:'#8FD65C', borderRadius:8}]}, options:{indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{max:100}}}}));

  const cats={}; ud.expenses.filter(e=>e.type==='expense').forEach(e=>{ cats[e.category]=(cats[e.category]||0)+e.amount; });
  anaCharts.push(safeChart(document.getElementById('anaExpense'), {type:'pie', data:{labels:Object.keys(cats), datasets:[{data:Object.values(cats), backgroundColor:['#6F9D24','#2F5F67','#F5B942','#E85B5B','#8FD65C','#D6E34B']}]}, options:{plugins:{legend:{position:'bottom'}}}}));
}

