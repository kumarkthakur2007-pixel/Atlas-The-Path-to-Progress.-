/* ============================================================
   HEALTH
   ============================================================
   Purpose:   Health Tracker — sleep, water, weight/BMI, steps,
              calories, exercise minutes, and the 7-day chart.
   Inputs:    Health Tracker page form fields.
   Outputs:   Mutates ud.health[today]; re-renders the BMI card
              and #healthChart.
   Depends on: storage.js (userData, persist), utils.js
              (todayStr, safeChart), dashboard.js
              (renderDashboard).
   ============================================================ */
/* ============================================================
   HEALTH TRACKER
   ============================================================ */
function saveHealth(){
  const ud=userData(); const k=todayStr();
  ud.health[k]={
    sleep:Number(document.getElementById('hSleep').value)||0,
    water:Number(document.getElementById('hWater').value)||0,
    weight:Number(document.getElementById('hWeight').value)||0,
    height:Number(document.getElementById('hHeight').value)||(ud.health[k]?.height||0),
    steps:Number(document.getElementById('hSteps').value)||0,
    calories:Number(document.getElementById('hCalories').value)||0,
    exercise:Number(document.getElementById('hExercise').value)||0,
  };
  persist(); renderHealth(); renderDashboard();
  awardXP(5, 'health_logged'); // flat per-save amount (not per-field) to avoid multi-field edits over-awarding
}
let healthChartInst;
function renderHealth(){
  const ud=userData(); const k=todayStr(); const t=ud.health[k]||{};
  document.getElementById('hSleep').value=t.sleep||'';
  document.getElementById('hWater').value=t.water||'';
  document.getElementById('hWeight').value=t.weight||'';
  document.getElementById('hHeight').value=t.height||'';
  document.getElementById('hSteps').value=t.steps||'';
  document.getElementById('hCalories').value=t.calories||'';
  document.getElementById('hExercise').value=t.exercise||'';
  if(t.weight && t.height){
    const bmi=t.weight/((t.height/100)**2);
    document.getElementById('hBMI').textContent=bmi.toFixed(1);
    const cat=bmi<18.5?'Underweight':bmi<25?'Healthy':bmi<30?'Overweight':'Obese';
    document.getElementById('hBMICat').textContent=cat;
  } else { document.getElementById('hBMI').textContent='—'; document.getElementById('hBMICat').textContent='—'; }

  const labels=[], sleepData=[], waterData=[];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); labels.push(d.toLocaleDateString(undefined,{weekday:'short'}));
    sleepData.push(ud.health[key]?.sleep||0); waterData.push(ud.health[key]?.water||0); }
  if(healthChartInst) healthChartInst.destroy();
  healthChartInst=safeChart(document.getElementById('healthChart'), {
    type:'line', data:{labels, datasets:[
      {label:'Sleep (h)', data:sleepData, borderColor:'#2F5F67', backgroundColor:'rgba(47,95,103,.08)', tension:.4, fill:true},
      {label:'Water (glasses)', data:waterData, borderColor:'#3AAAC0', backgroundColor:'rgba(58,170,192,.08)', tension:.4, fill:true}
    ]}, options:{plugins:{legend:{position:'bottom'}}, scales:{y:{beginAtZero:true}}}
  });
}

