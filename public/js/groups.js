/* ═══════════════════════════════════════════════════
   Maktab AI – Groups data model (localStorage MVP)
   ═══════════════════════════════════════════════════ */

const GS = {
  _get(k){ try{return JSON.parse(localStorage.getItem(k))||[];}catch{return[];} },
  _set(k,d){ localStorage.setItem(k,JSON.stringify(d)); },

  getGroups()   { return this._get('mg_groups');   },
  getMembers()  { return this._get('mg_members');  },
  getMessages() { return this._get('mg_messages'); },
  saveGroups(d)   { this._set('mg_groups',d);   },
  saveMembers(d)  { this._set('mg_members',d);  },
  saveMessages(d) { this._set('mg_messages',d); },

  genId(){  return Date.now().toString(36)+Math.random().toString(36).slice(2,6); },
  genCode(){
    const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length:7},()=>c[Math.floor(Math.random()*c.length)]).join('');
  },

  /* ── Groups ── */
  createGroup(data){
    const groups=this.getGroups();
    const g={
      id:this.genId(), name:data.name, subject:data.subject, grade:data.grade,
      color:data.color||'#4b3bff', ownerId:data.ownerId, ownerName:data.ownerName,
      inviteCode:this.genCode(), requireApproval:data.requireApproval!==false,
      autoModeration:data.autoModeration!==false, createdAt:new Date().toISOString()
    };
    groups.push(g); this.saveGroups(groups);
    this.addMember(g.id, data.ownerId, data.ownerName, 'teacher', 'approved');
    return g;
  },
  getGroupById(id)    { return this.getGroups().find(g=>g.id===id)||null; },
  getGroupByCode(code){ return this.getGroups().find(g=>g.inviteCode===code)||null; },
  getUserGroups(uid){
    const mine=this.getMembers().filter(m=>m.userId===uid&&m.status==='approved');
    return mine.map(m=>{const g=this.getGroupById(m.groupId);return g?{...g,myRole:m.role}:null;}).filter(Boolean);
  },
  getTeacherGroups(uid){ return this.getGroups().filter(g=>g.ownerId===uid); },

  /* ── Members ── */
  addMember(groupId,userId,userName,role,status){
    const ms=this.getMembers();
    if(ms.some(m=>m.groupId===groupId&&m.userId===userId))return;
    ms.push({groupId,userId,userName,role:role||'member',status:status||'pending',joinedAt:new Date().toISOString()});
    this.saveMembers(ms);
  },
  getMember(gid,uid){ return this.getMembers().find(m=>m.groupId===gid&&m.userId===uid)||null; },
  getMemberStatus(gid,uid){ const m=this.getMember(gid,uid); return m?m.status:null; },
  getMemberRole(gid,uid){ const m=this.getMember(gid,uid); return m?m.role:null; },
  getGroupMembers(gid){ return this.getMembers().filter(m=>m.groupId===gid); },
  getPending(gid){ return this.getMembers().filter(m=>m.groupId===gid&&m.status==='pending'); },
  approveMember(gid,uid){
    const ms=this.getMembers(); const m=ms.find(m=>m.groupId===gid&&m.userId===uid);
    if(m){m.status='approved'; this.saveMembers(ms);}
  },
  removeMember(gid,uid){
    this.saveMembers(this.getMembers().filter(m=>!(m.groupId===gid&&m.userId===uid)));
  },

  /* ── Messages ── */
  sendMessage(groupId,userId,userName,text,flagged){
    const msgs=this.getMessages();
    const msg={id:this.genId(),groupId,userId,userName,text,
               flagged:flagged||false,deleted:false,pinned:false,createdAt:new Date().toISOString()};
    msgs.push(msg); this.saveMessages(msgs); return msg;
  },
  getGroupMessages(gid){ return this.getMessages().filter(m=>m.groupId===gid&&!m.deleted); },
  getFlagged(gid){ return this.getMessages().filter(m=>m.groupId===gid&&m.flagged&&!m.deleted); },
  flagMessage(id){ const ms=this.getMessages(); const m=ms.find(m=>m.id===id); if(m){m.flagged=true;this.saveMessages(ms);} },
  deleteMessage(id){ const ms=this.getMessages(); const m=ms.find(m=>m.id===id); if(m){m.deleted=true;this.saveMessages(ms);} },
  clearFlag(id){ const ms=this.getMessages(); const m=ms.find(m=>m.id===id); if(m){m.flagged=false;this.saveMessages(ms);} },
  pinMessage(id){
    const ms=this.getMessages(); ms.forEach(m=>{m.pinned=false;});
    const m=ms.find(m=>m.id===id); if(m){m.pinned=true;} this.saveMessages(ms);
  },

  /* ── Seed demo ── */
  seedDemo(currentUser){
    if(this.getGroups().length>0) return;
    const tid='demo_teacher_01', tname='Kamoliddin Usmonov';
    const g1=this.createGroup({name:'9-A Matematika',subject:'Matematika',grade:9,color:'#4b3bff',ownerId:tid,ownerName:tname});
    const g2=this.createGroup({name:'10-B Fizika',subject:'Fizika',grade:10,color:'#22c55e',ownerId:tid,ownerName:tname});
    this.addMember(g1.id,'s1','Aziz Karimov','member','approved');
    this.addMember(g1.id,'s2','Malika Yusupova','member','approved');
    this.addMember(g1.id,'s3','Bobur Toshmatov','member','pending');
    this.addMember(g2.id,'s1','Aziz Karimov','member','approved');
    if(currentUser&&currentUser.id){
      this.addMember(g1.id,String(currentUser.id),currentUser.name,'member','approved');
      this.addMember(g2.id,String(currentUser.id),currentUser.name,'member','approved');
    }
    const m1=this.sendMessage(g1.id,tid,tname,'Assalomu alaykum, 9-A! Ertaga test bo\'lamiz. Algebra 3–6 betlarni tayyorlab keling 📚');
    this.sendMessage(g1.id,'s1','Aziz Karimov','Yaxshi ustoz! Qaysi formulalarni bilib kelish kerak?');
    this.sendMessage(g1.id,tid,tname,'Kvadrat tenglamalar va diskriminant. Omad! 🎯');
    this.sendMessage(g2.id,tid,tname,'10-B guruhi, fizikadan yangi mavzu: Nyuton qonunlari. Darslikdan 45–50 betlar ⚡');
    this.pinMessage(m1.id);
  }
};

/* Auto-seed demo data on first load (any page that loads this file) */
(function(){
  try{
    if(GS.getGroups().length === 0){
      const cu = JSON.parse(localStorage.getItem('maktabai_currentUser') || 'null');
      GS.seedDemo(cu);
    }
  }catch(e){}
})();

/* Content moderation */
const BANNED_WORDS=['porno','seks','eryotik','narkotik','terror','bomb','yasiliq','qotil','haqorat'];
function moderateText(t){ const l=t.toLowerCase(); return BANNED_WORDS.some(w=>l.includes(w)); }

/* Helpers */
const GROUP_COLORS=[
  {v:'#4b3bff',bg:'#f0eeff',label:'Binafsha'},
  {v:'#22c55e',bg:'#f0fdf4',label:'Yashil'},
  {v:'#f97316',bg:'#fff7ed',label:'To\'q sariq'},
  {v:'#ec4899',bg:'#fdf2f8',label:'Pushti'},
  {v:'#06b6d4',bg:'#ecfeff',label:'Ko\'k'},
  {v:'#f59e0b',bg:'#fffbeb',label:'Sariq'},
];
function colorBg(color){ const f=GROUP_COLORS.find(c=>c.v===color); return f?f.bg:'#f0eeff'; }
function initials(name){ return (name||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(); }
function timeAgo(iso){
  const diff=Date.now()-new Date(iso).getTime();
  if(diff<60000) return 'hozirgina';
  if(diff<3600000) return Math.floor(diff/60000)+'d oldin';
  if(diff<86400000) return Math.floor(diff/3600000)+'s oldin';
  return new Date(iso).toLocaleDateString('uz-UZ');
}
