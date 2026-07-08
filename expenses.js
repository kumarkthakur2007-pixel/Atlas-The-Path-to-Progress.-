/* ============================================================
   EXPENSES
   ============================================================
   Purpose:   Expense Tracker — income/expense/savings/balance,
              categories, the category pie chart and monthly
              trend line chart, transaction history, CSV export.
   Inputs:    Expense Tracker page controls; the "Add
              transaction" modal.
   Outputs:   Mutates ud.expenses; re-renders the stat cards,
              charts, and #expenseListWrap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js
              (uid, todayStr, fmtMoney, safeChart).
   ============================================================ */
/* ============================================================
   EXPENSE TRACKER
   ============================================================ */
function openExpenseModal(){
  openModal('Add transaction', `
    <div class="field"><label>Type</label><select id="xType"><option value="income">Income</option><option value="expense" selected>Expense</option></select></div>
    <div class="field-row">
      <div class="field"><label>Amount (₹)</label><input type="number" id="xAmount" min="0"></div>
      <div class="field"><label>Category</label><select id="xCategory"><option>Food</option><option>Travel</option><option>Shopping</option><option>Education</option><option>Bills</option><option>Custom</option></select></div>
    </div>
    <div class="field"><label>Note</label><input type="text" id="xNote" placeholder="Optional note"></div>
    <div class="field"><label>Date</label><input type="date" id="xDate" value="${todayStr()}"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveExpense()">Save</button>`);
}
function saveExpense(){
  const ud=userData(); const amt=Number(document.getElementById('xAmount').value);
  if(!amt){ showToast('error','Enter an amount.'); return; }
  ud.expenses.unshift({id:uid(), type:document.getElementById('xType').value, amount:amt, category:document.getElementById('xCategory').value, note:document.getElementById('xNote').value, date:document.getElementById('xDate').value});
  persist(); closeModal(); renderExpenses(); showToast('success','Transaction added.');
}
function deleteExpense(id){ const ud=userData(); ud.expenses=ud.expenses.filter(e=>e.id!==id); persist(); renderExpenses(); }
function exportExpensesCSV(){
  const ud=userData();
  let csv='Date,Type,Category,Amount,Note\n';
  ud.expenses.forEach(e=>{ csv+=`${e.date},${e.type},${e.category},${e.amount},"${(e.note||'').replace(/"/g,'')}"\n`; });
  const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='expenses.csv'; a.click();
}
let pieChartInst, lineChartInst;
function renderExpenses(){
  const ud=userData(); const q=(document.getElementById('expSearch').value||'').trim().toLowerCase();
  ud.uiState.expSearch=q; persist();
  const income=ud.expenses.filter(e=>e.type==='income').reduce((a,b)=>a+b.amount,0);
  const expense=ud.expenses.filter(e=>e.type==='expense').reduce((a,b)=>a+b.amount,0);
  document.getElementById('expIncome').textContent=fmtMoney(income);
  document.getElementById('expExpense').textContent=fmtMoney(expense);
  document.getElementById('expSavings').textContent=fmtMoney(Math.max(0,income-expense));
  document.getElementById('expBalance').textContent=fmtMoney(income-expense);

  const cats={};
  ud.expenses.filter(e=>e.type==='expense').forEach(e=>{ cats[e.category]=(cats[e.category]||0)+e.amount; });
  if(pieChartInst) pieChartInst.destroy();
  pieChartInst=safeChart(document.getElementById('expensePie'), {
    type:'doughnut', data:{labels:Object.keys(cats), datasets:[{data:Object.values(cats), backgroundColor:['#6F9D24','#2F5F67','#F5B942','#E85B5B','#8FD65C','#D6E34B'], borderWidth:0}]},
    options:{plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:11}}}}, cutout:'65%'}
  });

  const months=[]; const monthMap={};
  for(let i=5;i>=0;i--){ const d=new Date(); d.setMonth(d.getMonth()-i); const key=d.toLocaleDateString(undefined,{month:'short'}); months.push(key); monthMap[key]=0; }
  ud.expenses.filter(e=>e.type==='expense').forEach(e=>{ const key=new Date(e.date).toLocaleDateString(undefined,{month:'short'}); if(key in monthMap) monthMap[key]+=e.amount; });
  if(lineChartInst) lineChartInst.destroy();
  lineChartInst=safeChart(document.getElementById('expenseLine'), {
    type:'line', data:{labels:months, datasets:[{data:Object.values(monthMap), borderColor:'#2F5F67', backgroundColor:'rgba(47,95,103,0.1)', fill:true, tension:.4}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });

  const wrap=document.getElementById('expenseListWrap');
  const list=ud.expenses.filter(e=>(e.note||'').toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  if(!list.length){ wrap.innerHTML='<div class="empty-state"><div class="es-title">No transactions</div>Add your first one above.</div>'; return; }
  wrap.innerHTML='';
  list.forEach(e=>{
    const row=document.createElement('div'); row.className='task-row';
    row.innerHTML=`<div class="task-body"><div class="task-title">${e.category} ${e.note?'· '+e.note:''}</div><div class="task-meta"><span><i data-lucide="calendar"></i>${e.date}</span></div></div>
    <div style="font-weight:800; color:${e.type==='income'?'var(--success)':'var(--danger)'}">${e.type==='income'?'+':'-'}${fmtMoney(e.amount)}</div>
    <div class="task-actions"><button onclick="deleteExpense('${e.id}')"><i data-lucide="trash-2"></i></button></div>`;
    wrap.appendChild(row);
  });
  safeCreateIcons();
}

