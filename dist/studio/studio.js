/*! DomoView 0.1.0 | MIT | https://github.com/tomjschr/interactive_floormap
 * Bundles three.js (MIT) and Material Design Icons paths (Apache-2.0).
 */
var Uu=0;function fr(s){return Uu+=1,`${s}_${Uu.toString(36)}`}function Bt(s,e="item"){return String(s).toLowerCase().replace(/[äàáâã]/g,"a").replace(/[öòóô]/g,"o").replace(/[üùúû]/g,"u").replace(/[ëèéê]/g,"e").replace(/[ïìíî]/g,"i").replace(/ß/g,"ss").replace(/[^a-z0-9-]+/g,"_").replace(/_{2,}/g,"_").replace(/^[_-]+|[_-]+$/g,"")||e}function ys(){return{version:1,meta:{id:"my-home",name:"My Home",author:"",license:"CC-BY-4.0",description:"",north:0},plan:{image:null,imageWidth:0,imageHeight:0,opacity:.55,scale:null,calibration:null},level:{height:2.55,elevation:0},walls:[],rooms:[],openings:[],fixtures:[],furniture:[],photos:[],materials:{wall:"#d9d4cc",floor:"#b08c63",ceiling:"#efece6",furniture:"#8a8478"},camera:{azimuth:225,elevation:40,zoom:1,clipAbove:0}}}var vs=class s{constructor(e=ys()){this.data=e,this.undoStack=[],this.redoStack=[],this.listeners=new Set}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notify(e="change"){for(let t of this.listeners)t(this.data,e)}commit(e,t){this.undoStack.push({label:e,data:structuredClone(this.data)}),this.undoStack.length>80&&this.undoStack.shift(),this.redoStack.length=0,t(this.data),this.notify(e)}touch(e,t="drag"){e(this.data),this.notify(t)}undo(){let e=this.undoStack.pop();return e?(this.redoStack.push({label:e.label,data:structuredClone(this.data)}),this.data=e.data,this.notify("undo"),!0):!1}redo(){let e=this.redoStack.pop();return e?(this.undoStack.push({label:e.label,data:structuredClone(this.data)}),this.data=e.data,this.notify("redo"),!0):!1}get canUndo(){return this.undoStack.length>0}get canRedo(){return this.redoStack.length>0}addWall(e,t){let n={id:fr("wall"),a:e,b:t,thickness:.12,height:this.data.level.height,exterior:!1,flip:!1};return this.commit("add wall",i=>i.walls.push(n)),n}addRoom(e,t){let n={id:fr("room"),name:t||`Room ${this.data.rooms.length+1}`,polygon:e,outdoor:!1,label:null,climate:!0};return this.commit("add room",i=>i.rooms.push(n)),n}addOpening(e,t,n="window"){let i={id:fr(n==="door"?"door":"win"),type:n,name:"",wall:e,offset:t,width:n==="door"?.9:1.2,sill:n==="window"?.9:0,head:n==="window"?2.2:2.05,rooms:[],mullion:null,cover:n==="window",coverProfile:"venetian",coverInFront:!1};return this.commit("add opening",r=>r.openings.push(i)),i}addFixture(e,t="light"){let n={id:fr(t),name:"",kind:t,room:null,emitters:[{point:e,height:this.data.level.height-.15,type:"point",intensity:1}],lumens:600,color:"#ffdda4",range:6,shadow:!1,bulb:"glow",variant:null};return this.commit("add fixture",i=>i.fixtures.push(n)),n}addFurniture(e){let t={id:fr("furn"),name:"Furniture",rect:e,base:0,top:.75,solid:!0,occluder:!0};return this.commit("add furniture",n=>n.furniture.push(t)),t}remove(e,t){this.commit(`remove ${e}`,n=>{n[e]=n[e].filter(i=>i.id!==t),e==="walls"&&(n.openings=n.openings.filter(i=>i.wall!==t))})}find(e,t){return this.data[e].find(n=>n.id===t)||null}toJSON(){return JSON.stringify({...this.data,version:1},null,2)}static fromJSON(e){let t=JSON.parse(e);if(t.version!==1)throw new Error(`Project file version ${t.version} cannot be opened by this build (expected 1)`);let n={...ys(),...t};return n.meta={...ys().meta,...t.meta},n.plan={...ys().plan,...t.plan},n.materials={...ys().materials,...t.materials},n.camera={...ys().camera,...t.camera},new s(n)}};function Ou(s){let e=[];s.plan.scale||e.push({step:"scale",text:"Calibrate the plan scale first."}),s.walls.length||e.push({step:"walls",text:"Trace at least the outer walls."}),s.rooms.length||e.push({step:"rooms",text:"Outline at least one room."}),s.fixtures.length||e.push({step:"lights",text:"Place at least one light fixture."});for(let t of s.openings)t.type!=="door"&&!t.rooms.length&&e.push({step:"openings",text:`Window "${t.name||t.id}" is not assigned to a room, so it will not light one.`});for(let t of s.fixtures)t.room||e.push({step:"lights",text:`Fixture "${t.name||t.id}" has no room; it will still work but is harder to find in the editor.`});return e}var Ro=class{constructor(e){this.canvas=e,this.scale=1,this.offsetX=0,this.offsetY=0,this.minScale=.05,this.maxScale=40,this.onChange=()=>{}}toScreen(e){return[e[0]*this.scale+this.offsetX,e[1]*this.scale+this.offsetY]}toPlan(e,t){return[(e-this.offsetX)/this.scale,(t-this.offsetY)/this.scale]}get pixelSize(){return 1/this.scale}eventToPlan(e){let t=this.canvas.getBoundingClientRect();return this.toPlan(e.clientX-t.left,e.clientY-t.top)}fit(e,t,n=.06){let i=this.canvas.getBoundingClientRect();if(!e||!t||!i.width)return;let r=Math.min(i.width/e,i.height/t)*(1-n*2);this.scale=Math.max(this.minScale,Math.min(this.maxScale,r)),this.offsetX=(i.width-e*this.scale)/2,this.offsetY=(i.height-t*this.scale)/2,this.onChange()}zoomAt(e,t,n){let i=Math.max(this.minScale,Math.min(this.maxScale,this.scale*n));if(i===this.scale)return;let[r,o]=this.toPlan(e,t);this.scale=i,this.offsetX=e-r*this.scale,this.offsetY=t-o*this.scale,this.onChange()}pan(e,t){this.offsetX+=e,this.offsetY+=t,this.onChange()}attach(){this.canvas.addEventListener("wheel",n=>{n.preventDefault();let i=this.canvas.getBoundingClientRect(),r=Math.exp(-n.deltaY*.0016);this.zoomAt(n.clientX-i.left,n.clientY-i.top,r)},{passive:!1});let e=null;this.canvas.addEventListener("pointerdown",n=>{(n.button===1||n.button===2||n.button===0&&(n.spaceKey||this.spaceHeld))&&(n.preventDefault(),e={x:n.clientX,y:n.clientY,id:n.pointerId},this.canvas.setPointerCapture(n.pointerId))}),this.canvas.addEventListener("pointermove",n=>{!e||e.id!==n.pointerId||(this.pan(n.clientX-e.x,n.clientY-e.y),e.x=n.clientX,e.y=n.clientY)});let t=n=>{e?.id===n.pointerId&&(this.canvas.releasePointerCapture?.(n.pointerId),e=null)};this.canvas.addEventListener("pointerup",t),this.canvas.addEventListener("pointercancel",t),this.canvas.addEventListener("contextmenu",n=>n.preventDefault()),window.addEventListener("keydown",n=>{n.code==="Space"&&(this.spaceHeld=!0)}),window.addEventListener("keyup",n=>{n.code==="Space"&&(this.spaceHeld=!1)})}};var xi=Math.PI/180;function Xi(s,e,t){let n=!1;for(let i=0,r=t.length-1;i<t.length;r=i++){let o=t[i],a=t[r];o[1]>e!=a[1]>e&&s<(a[0]-o[0])*(e-o[1])/(a[1]-o[1])+o[0]&&(n=!n)}return n}function Co(s){let e=0,t=0,n=0;for(let i=0,r=s.length-1;i<s.length;r=i++){let[o,a]=s[r],[c,l]=s[i],h=o*l-c*a;e+=h,t+=(o+c)*h,n+=(a+l)*h}if(Math.abs(e)<1e-9){let i=s.length;return[s.reduce((r,o)=>r+o[0],0)/i,s.reduce((r,o)=>r+o[1],0)/i]}return[t/(3*e),n/(3*e)]}function Fu(s){let e=0;for(let t=0,n=s.length-1;t<s.length;n=t++)e+=s[n][0]*s[t][1]-s[t][0]*s[n][1];return e<0?s.slice().reverse():s}function Yi(s,e,t=!1){let n=e[0]-s[0],i=e[1]-s[1],r=Math.hypot(n,i)||1e-6,o=[n/r,i/r],a=t?[-o[1],o[0]]:[o[1],-o[0]];return{tangent:o,normal:a,length:r}}function Wc(s,e){return[s.a[0]+s.tangent[0]*e,s.a[1]+s.tangent[1]*e]}function Xc(s,e){if(!s?.length)return e;let t=s[0],n=s[s.length-1];if(e<=t[0])return t[1];if(e>=n[0])return n[1];for(let i=1;i<s.length;i++){let[r,o]=s[i-1],[a,c]=s[i];if(e<=a){let l=a-r;return l<1e-9?c:o+(c-o)*(e-r)/l}}return n[1]}function ke(s,e=0,t=1){return s<e?e:s>t?t:s}function Yc(s){return s.min.map((e,t)=>(e+s.max[t])/2)}function Bu(s){return s.max.map((e,t)=>e-s.min[t])}var yi=class{constructor(e){this.scale=e.plan.scale||.02;let t=$c(e)||{min:[0,0],max:[e.plan.imageWidth||1e3,e.plan.imageHeight||1e3]};this.originX=(t.min[0]+t.max[0])/2,this.originY=(t.min[1]+t.max[1])/2}point([e,t]){return[qc((e-this.originX)*this.scale),qc(-(t-this.originY)*this.scale)]}length(e){return qc(e*this.scale)}polygon(e){return e.map(t=>this.point(t))}};function qc(s){let e=Math.round(s*1e4)/1e4;return e===0?0:e}function $c(s){let e=[];for(let i of s.walls)e.push(i.a,i.b);for(let i of s.rooms)e.push(...i.polygon);for(let i of s.furniture)e.push(...i.rect);for(let i of s.fixtures)for(let r of i.emitters)e.push(r.point);if(!e.length)return null;let t=e.map(i=>i[0]),n=e.map(i=>i[1]);return{min:[Math.min(...t),Math.min(...n)],max:[Math.max(...t),Math.max(...n)]}}function pr(s){let e=s.b[0]-s.a[0],t=-(s.b[1]-s.a[1]),n=Math.hypot(e,t)||1e-6,i=[e/n,t/n],r=s.flip?[-i[1],i[0]]:[i[1],-i[0]];return{tangent:i,normal:r,length:n}}function ku(s){let{normal:e}=pr(s);return[e[0],-e[1]]}function mr(s){let e=String(s).replace("#",""),t=e.length===3?e.split("").map(i=>i+i).join(""):e,n=Number.parseInt(t,16);return Number.isFinite(n)?[n>>16&255,n>>8&255,n&255]:[255,221,164]}function zu([s,e,t]){let n=i=>Math.max(0,Math.min(255,Math.round(i)));return`#${[s,e,t].map(i=>n(i).toString(16).padStart(2,"0")).join("")}`}var vt={wall:"#f0f4f3",wallExterior:"#8fe0c8",room:"rgba(96, 196, 176, 0.14)",roomOutline:"rgba(120, 224, 200, 0.85)",roomOutdoor:"rgba(224, 186, 96, 0.16)",roomOutdoorOutline:"rgba(240, 200, 120, 0.85)",window:"#7fc4ff",door:"#d7b46a",fixture:"#ffd479",fixtureMedia:"#9fc4ff",furniture:"rgba(170, 164, 150, 0.35)",furnitureOutline:"rgba(200, 194, 178, 0.8)",selection:"#ff7bd0",ghost:"rgba(255, 255, 255, 0.55)",calibration:"#ff9f6b",snap:"#ffffff"},Io=class{constructor(e,t){this.canvas=e,this.viewport=t,this.context=e.getContext("2d"),this.backdrop=null}async setBackdrop(e){if(!e)return this.backdrop=null,null;let t=new Image;return await new Promise((n,i)=>{t.onload=n,t.onerror=()=>i(new Error("The floor plan image could not be decoded.")),t.src=e}),this.backdrop=t,t}resize(){let e=this.canvas.getBoundingClientRect(),t=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.max(1,Math.round(e.width*t)),this.canvas.height=Math.max(1,Math.round(e.height*t)),this.context.setTransform(t,0,0,t,0,0),this.ratio=t}draw(e,t={}){let n=this.context,i=this.canvas.getBoundingClientRect();n.save(),n.setTransform(this.ratio,0,0,this.ratio,0,0),n.clearRect(0,0,i.width,i.height),this.drawBackdrop(e),this.drawRooms(e,t),this.drawFurniture(e,t),this.drawWalls(e,t),this.drawOpenings(e,t),this.drawFixtures(e,t),this.drawCalibration(e,t),this.drawDraft(e,t),this.drawSnap(t),n.restore(),this.drawScaleBar(e,i)}drawBackdrop(e){if(!this.backdrop)return;let t=this.context,[n,i]=this.viewport.toScreen([0,0]);t.save(),t.globalAlpha=e.plan.opacity,t.imageSmoothingQuality="high",t.drawImage(this.backdrop,n,i,this.backdrop.naturalWidth*this.viewport.scale,this.backdrop.naturalHeight*this.viewport.scale),t.restore()}path(e,t=!0){let n=this.context;n.beginPath(),e.forEach((i,r)=>{let[o,a]=this.viewport.toScreen(i);r?n.lineTo(o,a):n.moveTo(o,a)}),t&&n.closePath()}drawRooms(e,t){let n=this.context;for(let i of e.rooms){if(i.polygon.length<3)continue;let r=t.selected?.collection==="rooms"&&t.selected.id===i.id;this.path(i.polygon),n.fillStyle=i.outdoor?vt.roomOutdoor:vt.room,n.fill(),n.strokeStyle=r?vt.selection:i.outdoor?vt.roomOutdoorOutline:vt.roomOutline,n.lineWidth=r?2.5:1.3,n.setLineDash(i.outdoor?[7,4]:[]),n.stroke(),n.setLineDash([]);let[o,a]=this.viewport.toScreen(i.label||Co(i.polygon));n.fillStyle="#eafaf4",n.font="600 12px system-ui, sans-serif",n.textAlign="center",n.textBaseline="middle",n.fillText(i.name,o,a)}}drawFurniture(e,t){let n=this.context;for(let i of e.furniture){let r=t.selected?.collection==="furniture"&&t.selected.id===i.id;this.path(i.rect),n.fillStyle=vt.furniture,n.fill(),n.strokeStyle=r?vt.selection:vt.furnitureOutline,n.lineWidth=r?2.5:1.1,n.stroke()}}drawWalls(e,t){let n=this.context,i=e.plan.scale?1/e.plan.scale:20;for(let r of e.walls){let o=t.selected?.collection==="walls"&&t.selected.id===r.id,[a,c]=this.viewport.toScreen(r.a),[l,h]=this.viewport.toScreen(r.b);if(n.beginPath(),n.moveTo(a,c),n.lineTo(l,h),n.lineCap="round",n.lineWidth=Math.max(2,r.thickness*i*this.viewport.scale),n.strokeStyle=o?vt.selection:r.exterior?vt.wallExterior:vt.wall,n.globalAlpha=.9,n.stroke(),n.globalAlpha=1,o||t.showHandles)for(let u of[r.a,r.b]){let[f,d]=this.viewport.toScreen(u);n.beginPath(),n.arc(f,d,4,0,Math.PI*2),n.fillStyle=o?vt.selection:"#ffffffcc",n.fill()}if(r.exterior||o){let u=ku(r),[f,d]=this.viewport.toScreen([(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2]),m=f+u[0]*18,_=d+u[1]*18;n.beginPath(),n.moveTo(f,d),n.lineTo(m,_),n.strokeStyle="#ffd479",n.lineWidth=1.5,n.stroke(),n.beginPath(),n.arc(m,_,2.5,0,Math.PI*2),n.fillStyle="#ffd479",n.fill()}}}drawOpenings(e,t){let n=this.context,i=e.plan.scale?1/e.plan.scale:20;for(let r of e.openings){let o=e.walls.find(g=>g.id===r.wall);if(!o)continue;let a=Yi(o.a,o.b,o.flip),c=r.width/2*i,l=[o.a[0]+a.tangent[0]*(r.offset-c),o.a[1]+a.tangent[1]*(r.offset-c)],h=[o.a[0]+a.tangent[0]*(r.offset+c),o.a[1]+a.tangent[1]*(r.offset+c)],u=t.selected?.collection==="openings"&&t.selected.id===r.id,[f,d]=this.viewport.toScreen(l),[m,_]=this.viewport.toScreen(h);n.beginPath(),n.moveTo(f,d),n.lineTo(m,_),n.lineCap="butt",n.lineWidth=Math.max(3,o.thickness*i*this.viewport.scale*1.4),n.strokeStyle=u?vt.selection:r.type==="door"?vt.door:vt.window,n.stroke()}}drawFixtures(e,t){let n=this.context;for(let i of e.fixtures){let r=t.selected?.collection==="fixtures"&&t.selected.id===i.id;for(let o of i.emitters){let[a,c]=this.viewport.toScreen(o.point);n.beginPath(),n.arc(a,c,r?7:5,0,Math.PI*2),n.fillStyle=i.kind==="light"?i.color:vt.fixtureMedia,n.fill(),n.lineWidth=r?2.5:1.2,n.strokeStyle=r?vt.selection:"#15242c",n.stroke()}i.emitters.length>1&&(this.path(i.emitters.map(o=>o.point),!1),n.setLineDash([3,3]),n.strokeStyle="#ffffff66",n.lineWidth=1,n.stroke(),n.setLineDash([]))}}drawCalibration(e,t){let n=t.calibrationDraft||e.plan.calibration;if(!n?.a)return;let i=this.context,r=n.b||t.cursor;if(!r)return;let[o,a]=this.viewport.toScreen(n.a),[c,l]=this.viewport.toScreen(r);i.beginPath(),i.moveTo(o,a),i.lineTo(c,l),i.strokeStyle=vt.calibration,i.lineWidth=2,i.setLineDash([6,4]),i.stroke(),i.setLineDash([]);for(let[h,u]of[[o,a],[c,l]])i.beginPath(),i.arc(h,u,4,0,Math.PI*2),i.fillStyle=vt.calibration,i.fill();e.plan.calibration?.metres&&n===e.plan.calibration&&(i.fillStyle=vt.calibration,i.font="600 12px system-ui, sans-serif",i.textAlign="center",i.fillText(`${e.plan.calibration.metres} m`,(o+c)/2,(a+l)/2-8))}drawDraft(e,t){let n=t.draft;if(!n?.points?.length)return;let i=this.context,r=t.cursor?[...n.points,t.cursor]:n.points;if(n.kind==="rect"&&r.length>=2){let[o,a]=[r[0],r[r.length-1]];this.path([[o[0],o[1]],[a[0],o[1]],[a[0],a[1]],[o[0],a[1]]])}else this.path(r,n.kind==="polygon");i.strokeStyle=vt.ghost,i.lineWidth=1.6,i.setLineDash([5,4]),i.stroke(),i.setLineDash([]);for(let o of n.points){let[a,c]=this.viewport.toScreen(o);i.beginPath(),i.arc(a,c,3.5,0,Math.PI*2),i.fillStyle=vt.ghost,i.fill()}if(r.length>=2&&e.plan.scale){let o=r[r.length-2],a=r[r.length-1],c=Math.hypot(a[0]-o[0],a[1]-o[1])*e.plan.scale,[l,h]=this.viewport.toScreen(a);i.fillStyle="#eafaf4",i.font="600 11px ui-monospace, monospace",i.textAlign="left",i.fillText(`${c.toFixed(2)} m`,l+10,h-8)}}drawSnap(e){if(!e.snap)return;let t=this.context,[n,i]=this.viewport.toScreen(e.snap.point);t.beginPath(),t.arc(n,i,7,0,Math.PI*2),t.strokeStyle=vt.snap,t.lineWidth=1.5,t.stroke()}drawScaleBar(e,t){if(!e.plan.scale)return;let n=this.context,i=[.5,1,2,5,10,20,50],r=this.viewport.scale/e.plan.scale,o=i.find(h=>h*r>=60)??50,a=o*r,c=16,l=t.height-22;n.save(),n.setTransform(this.ratio,0,0,this.ratio,0,0),n.fillStyle="#0f1a20cc",n.fillRect(c-6,l-14,a+12,26),n.strokeStyle="#eafaf4",n.lineWidth=2,n.beginPath(),n.moveTo(c,l),n.lineTo(c+a,l),n.moveTo(c,l-5),n.lineTo(c,l+5),n.moveTo(c+a,l-5),n.lineTo(c+a,l+5),n.stroke(),n.fillStyle="#eafaf4",n.font="600 11px system-ui, sans-serif",n.textAlign="left",n.textBaseline="alphabetic",n.fillText(`${o} m`,c,l-6),n.restore()}};var $p=11,Kp=8;var Lo=class{constructor({canvas:e,viewport:t,project:n,onRedraw:i,onSelect:r,onAskDistance:o,onStatus:a}){this.canvas=e,this.viewport=t,this.project=n,this.onRedraw=i,this.onSelect=r||(()=>{}),this.onAskDistance=o,this.onStatus=a||(()=>{}),this.tool="select",this.draft=null,this.cursor=null,this.snap=null,this.selected=null,this.dragging=null,this.calibrationDraft=null,this.orthogonal=!0,this.attach()}get data(){return this.project.data}get state(){return{tool:this.tool,draft:this.draft,cursor:this.cursor,snap:this.snap,selected:this.selected,calibrationDraft:this.calibrationDraft,showHandles:this.tool==="select"}}setTool(e){this.tool=e,this.draft=null,this.calibrationDraft=null,this.snap=null,this.canvas.style.cursor=e==="select"?"default":"crosshair",this.onStatus(this.hint()),this.onRedraw()}hint(){return{select:"Click to select, drag to move. Delete removes the selection.",calibrate:"Click two points a known distance apart, then type that distance.",wall:"Click to trace wall corners. Double-click or Enter finishes the run, Escape cancels.",room:"Click around a room. Double-click or Enter closes the outline.",window:"Click on a wall to place a window there.",door:"Click on a wall to place a door there.",light:"Click to place a light. Shift-click adds another bulb to the selected fixture.",furniture:"Drag a rectangle over a piece of furniture. Its height is set in the panel."}[this.tool]||""}select(e,t){this.selected=e?{collection:e,id:t}:null,this.onSelect(this.selected),this.onRedraw()}get snapDistance(){return $p*this.viewport.pixelSize}findSnap(e,{skipWall:t=null}={}){let n=this.snapDistance,i=null;for(let r of this.data.walls)if(r.id!==t)for(let[o,a]of[[r.a,"a"],[r.b,"b"]]){let c=Math.hypot(e[0]-o[0],e[1]-o[1]);c<n&&(!i||c<i.distance)&&(i={point:[...o],distance:c,kind:"corner",wall:r.id,which:a})}if(i)return i;for(let r of this.data.walls){if(r.id===t)continue;let o=Po(e,r.a,r.b);o.distance<n&&(!i||o.distance<i.distance)&&(i={point:o.point,distance:o.distance,kind:"edge",wall:r.id,along:o.along})}return i}constrainAngle(e,t){if(!this.orthogonal)return t;let n=t[0]-e[0],i=t[1]-e[1],r=Math.hypot(n,i);if(r<1e-6)return t;let o=Math.PI/12,a=Math.round(Math.atan2(i,n)/o)*o;return[e[0]+Math.cos(a)*r,e[1]+Math.sin(a)*r]}resolvePoint(e,t){let n=this.findSnap(e);return this.snap=n,n?n.point:t?this.constrainAngle(t,e):e}hitTest(e){let t=Kp*this.viewport.pixelSize;for(let i of this.data.fixtures)for(let r of i.emitters)if(Math.hypot(e[0]-r.point[0],e[1]-r.point[1])<t)return{collection:"fixtures",id:i.id,emitter:r};let n=this.data.plan.scale?1/this.data.plan.scale:20;for(let i of this.data.openings){let r=this.data.walls.find(c=>c.id===i.wall);if(!r)continue;let o=Yi(r.a,r.b,r.flip),a=[r.a[0]+o.tangent[0]*i.offset,r.a[1]+o.tangent[1]*i.offset];if(Math.hypot(e[0]-a[0],e[1]-a[1])<i.width/2*n)return{collection:"openings",id:i.id}}for(let i of this.data.walls)for(let[r,o]of[[i.a,"a"],[i.b,"b"]])if(Math.hypot(e[0]-r[0],e[1]-r[1])<t)return{collection:"walls",id:i.id,corner:o};for(let i of this.data.walls)if(Po(e,i.a,i.b).distance<t)return{collection:"walls",id:i.id};for(let i of this.data.furniture)if(Xi(e[0],e[1],i.rect))return{collection:"furniture",id:i.id};for(let i of this.data.rooms)if(i.polygon.length>=3&&Xi(e[0],e[1],i.polygon))return{collection:"rooms",id:i.id};return null}attach(){this.canvas.addEventListener("pointerdown",e=>{if(e.button!==0||this.viewport.spaceHeld)return;this.orthogonal=!e.shiftKey;let t=this.viewport.eventToPlan(e);this.handleDown(t,e)}),this.canvas.addEventListener("pointermove",e=>{this.orthogonal=!e.shiftKey;let t=this.viewport.eventToPlan(e);this.handleMove(t,e)}),this.canvas.addEventListener("pointerup",e=>{e.button===0&&this.handleUp(this.viewport.eventToPlan(e),e)}),this.canvas.addEventListener("dblclick",e=>{e.preventDefault(),this.finishDraft()}),this.canvas.addEventListener("pointerleave",()=>{this.cursor=null,this.snap=null,this.onRedraw()}),window.addEventListener("keydown",e=>{e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||(e.key==="Escape"&&(this.draft=null,this.calibrationDraft=null,this.onRedraw()),e.key==="Enter"&&this.finishDraft(),(e.key==="Delete"||e.key==="Backspace")&&this.selected&&(e.preventDefault(),this.project.remove(this.selected.collection,this.selected.id),this.select(null)),(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&(e.preventDefault(),e.shiftKey?this.project.redo():this.project.undo()))})}handleDown(e,t){switch(this.tool){case"select":return this.startSelectDrag(e);case"calibrate":return this.handleCalibrate(e);case"wall":case"room":return this.addDraftPoint(e);case"window":case"door":return this.placeOpening(e);case"light":return this.placeLight(e,t);case"furniture":return this.startRect(e);default:return}}handleMove(e,t){let n=this.draft?.points?.at(-1)||null;this.cursor=this.resolvePoint(e,n),this.dragging?this.applyDrag(this.cursor,t):this.tool==="furniture"&&this.draft?.kind,this.onRedraw()}handleUp(){if(this.dragging?.moved){let e=this.dragging.before,t=structuredClone(this.data);this.project.data=e,this.project.commit(`move ${this.dragging.target.collection}`,n=>{Object.assign(n,t)})}this.dragging=null,this.tool==="furniture"&&this.draft?.kind==="rect"&&this.draft.points.length===1&&this.finishDraft()}startSelectDrag(e){let t=this.hitTest(e);this.select(t?.collection||null,t?.id),t&&(this.dragging={target:t,origin:e,before:structuredClone(this.data),moved:!1})}applyDrag(e,t){let{target:n,origin:i}=this.dragging,r=e[0]-i[0],o=e[1]-i[1];Math.abs(r)<1e-9&&Math.abs(o)<1e-9||(this.dragging.moved=!0,this.dragging.origin=e,this.project.touch(a=>{if(n.collection==="walls"){let c=a.walls.find(l=>l.id===n.id);if(!c)return;if(n.corner){let l=this.findSnap(e,{skipWall:c.id});c[n.corner]=l?[...l.point]:e}else c.a=[c.a[0]+r,c.a[1]+o],c.b=[c.b[0]+r,c.b[1]+o]}else if(n.collection==="fixtures"){let c=a.fixtures.find(h=>h.id===n.id),l=c?.emitters.find(h=>h.point[0]===n.emitter.point[0]&&h.point[1]===n.emitter.point[1]);if(l)l.point=e,n.emitter=l;else if(c)for(let h of c.emitters)h.point=[h.point[0]+r,h.point[1]+o]}else if(n.collection==="rooms"){let c=a.rooms.find(l=>l.id===n.id);c&&(c.polygon=c.polygon.map(([l,h])=>[l+r,h+o]))}else if(n.collection==="furniture"){let c=a.furniture.find(l=>l.id===n.id);c&&(c.rect=c.rect.map(([l,h])=>[l+r,h+o]))}else if(n.collection==="openings"){let c=a.openings.find(h=>h.id===n.id),l=a.walls.find(h=>h.id===c?.wall);if(c&&l){let h=Po(e,l.a,l.b);c.offset=h.along}}}),t?.shiftKey===!1&&(this.snap=this.findSnap(e)))}async handleCalibrate(e){if(!this.calibrationDraft?.a){this.calibrationDraft={a:e},this.onRedraw();return}let t=this.calibrationDraft.a,n=this.constrainAngle(t,e),i=Math.hypot(n[0]-t[0],n[1]-t[1]);if(this.calibrationDraft={a:t,b:n},this.onRedraw(),i<4){this.onStatus({error:"Those two points are too close together to calibrate from."}),this.calibrationDraft=null;return}let r=await this.onAskDistance(i);if(!r||!(r>0)){this.calibrationDraft=null,this.onRedraw();return}this.project.commit("calibrate",o=>{o.plan.scale=r/i,o.plan.calibration={a:t,b:n,metres:r}}),this.calibrationDraft=null,this.setTool("wall")}addDraftPoint(e){let t=this.draft?.points?.at(-1)||null,n=this.resolvePoint(e,t);if(!this.draft)this.draft={kind:this.tool==="room"?"polygon":"polyline",points:[n]};else{let i=this.draft.points[0];if(this.draft.kind==="polygon"&&this.draft.points.length>=3&&Math.hypot(n[0]-i[0],n[1]-i[1])<this.snapDistance){this.finishDraft();return}this.draft.points.push(n)}this.onRedraw()}startRect(e){this.draft={kind:"rect",points:[e]},this.dragging=null,this.onRedraw()}finishDraft(){let e=this.draft;if(e){if(this.draft=null,e.kind==="polyline"&&e.points.length>=2)this.project.commit("trace walls",t=>{for(let n=1;n<e.points.length;n++)t.walls.push({id:`wall_${Math.random().toString(36).slice(2,8)}`,a:e.points[n-1],b:e.points[n],thickness:.12,height:t.level.height,exterior:!1,flip:!1})});else if(e.kind==="polygon"&&e.points.length>=3)this.project.addRoom(e.points);else if(e.kind==="rect"&&this.cursor){let[t,n]=[e.points[0],this.cursor];Math.abs(n[0]-t[0])>2&&Math.abs(n[1]-t[1])>2&&this.project.addFurniture([[t[0],t[1]],[n[0],t[1]],[n[0],n[1]],[t[0],n[1]]])}this.onRedraw()}}placeOpening(e){let t=16*this.viewport.pixelSize,n=null;for(let c of this.data.walls){let l=Po(e,c.a,c.b);l.distance<t&&(!n||l.distance<n.distance)&&(n={wall:c,...l})}if(!n){this.onStatus({error:"Click directly on a wall to place an opening in it."});return}let i=this.project.addOpening(n.wall.id,n.along,this.tool),r=Yi(n.wall.a,n.wall.b,n.wall.flip),o=[n.point[0]-r.normal[0]*t,n.point[1]-r.normal[1]*t],a=this.data.rooms.find(c=>c.polygon.length>=3&&Xi(o[0],o[1],c.polygon));a&&this.project.touch(c=>{c.openings.find(l=>l.id===i.id).rooms=[a.id]}),this.select("openings",i.id)}placeLight(e,t){let n=this.snap?.point||e;if(t.shiftKey&&this.selected?.collection==="fixtures"){let o=this.selected.id;this.project.commit("add bulb",a=>{let c=a.fixtures.find(l=>l.id===o);c&&c.emitters.push({point:n,height:c.emitters.at(-1)?.height??a.level.height-.15,type:c.emitters.at(-1)?.type??"point",intensity:1})}),this.onRedraw();return}let i=this.project.addFixture(n),r=this.data.rooms.find(o=>o.polygon.length>=3&&Xi(n[0],n[1],o.polygon));r&&this.project.touch(o=>{let a=o.fixtures.find(c=>c.id===i.id);a.room=r.id,a.name=`${r.name} light ${o.fixtures.filter(c=>c.room===r.id).length}`}),this.select("fixtures",i.id)}};function Po(s,e,t){let n=t[0]-e[0],i=t[1]-e[1],r=n*n+i*i,o=r<1e-9?0:Math.max(0,Math.min(1,((s[0]-e[0])*n+(s[1]-e[1])*i)/r)),a=[e[0]+n*o,e[1]+i*o];return{point:a,distance:Math.hypot(s[0]-a[0],s[1]-a[1]),along:o*Math.sqrt(r)}}function $(s,e={},t=[]){let n=document.createElement(s);for(let[i,r]of Object.entries(e))i==="class"?n.className=r:i==="dataset"?Object.assign(n.dataset,r):i==="style"?Object.assign(n.style,r):i.startsWith("on")&&typeof r=="function"?n[i.toLowerCase()]=r:i==="html"?n.innerHTML=r:r!=null&&(n[i]=r);for(let i of[].concat(t))i==null||i===!1||n.append(i instanceof Node?i:document.createTextNode(String(i)));return n}function Re(s,e,t){return $("label",{class:"field"},[$("span",{class:"field-label"},s),e,t?$("small",{},t):null])}function vi(s,e,t={}){let n=$("input",{type:"text",value:s??"",...t});return n.onchange=()=>e(n.value),n}function rn(s,e,t={}){let{step:n=.01,min:i,max:r,unit:o}=t,a=$("input",{type:"number",value:s??0,step:n,...i!==void 0?{min:i}:{},...r!==void 0?{max:r}:{}}),c=()=>{let l=Number(a.value);Number.isFinite(l)&&e(l)};return a.onchange=c,o?$("span",{class:"with-unit"},[a,$("span",{class:"unit"},o)]):a}function En(s,e,t={}){let{min:n=0,max:i=100,step:r=1,format:o=h=>String(h)}=t,a=$("input",{type:"range",min:n,max:i,step:r,value:s}),c=$("output",{class:"readout"},o(s)),l=()=>{c.textContent=o(Number(a.value)),e(Number(a.value))};return a.oninput=l,$("span",{class:"with-readout"},[a,c])}function zn(s,e,t){let n=$("input",{type:"checkbox",checked:!!s});return n.onchange=()=>e(n.checked),t?$("span",{class:"check"},[n,$("span",{},t)]):n}function qi(s,e,t){let n=$("select",{},e.map(([i,r])=>$("option",{value:i,textContent:r,selected:String(i)===String(s)})));return n.onchange=()=>t(n.value),n}function Kc(s,e){let t=$("input",{type:"color",value:s||"#ffffff"});return t.oninput=()=>e(t.value),t}function nt(s,e,t={}){return $("button",{type:"button",textContent:s,onClick:e,...t})}function Wt(s,e){return $("section",{class:"group"},[s?$("h3",{},s):null,...[].concat(e).filter(Boolean)])}function Hu({title:s,message:e,unit:t="m",initial:n=""}){return new Promise(i=>{let r=$("input",{type:"number",step:"0.001",min:"0.001",value:n}),o=!1,a=u=>{o||(o=!0,h.remove(),document.removeEventListener("keydown",l),i(u))},c=()=>{let u=Number(r.value);a(Number.isFinite(u)&&u>0?u:null)},l=u=>{u.key==="Escape"&&a(null),u.key==="Enter"&&(u.preventDefault(),c())},h=$("div",{class:"modal-backdrop"},[$("div",{class:"modal",role:"dialog","aria-modal":"true"},[$("h2",{},s),$("p",{},e),$("div",{class:"modal-row"},[r,$("span",{class:"unit"},t)]),$("div",{class:"modal-actions"},[nt("Cancel",()=>a(null),{class:"ghost"}),nt("Apply",c,{class:"primary"})])])]);h.onclick=u=>{u.target===h&&a(null)},document.addEventListener("keydown",l),document.body.append(h),r.focus(),r.select()})}function Ot(s,e="info",t=4200){let n=document.querySelector(".toasts");n||(n=$("div",{class:"toasts",role:"status","aria-live":"polite"}),document.body.append(n));let i=$("div",{class:`toast ${e}`},s);return n.append(i),setTimeout(()=>i.remove(),t),i}function Do(s){return new Promise((e,t)=>{let n=new FileReader;n.onload=()=>e(n.result),n.onerror=()=>t(new Error(`${s.name} could not be read.`)),n.readAsDataURL(s)})}async function No(s,e=3e3){let t=new Image;await new Promise((c,l)=>{t.onload=c,t.onerror=()=>l(new Error("That file is not an image this browser can decode.")),t.src=s});let{naturalWidth:n,naturalHeight:i}=t;if(Math.max(n,i)<=e)return{dataUrl:s,width:n,height:i};let r=e/Math.max(n,i),o=$("canvas",{width:Math.round(n*r),height:Math.round(i*r)}),a=o.getContext("2d");return a.imageSmoothingQuality="high",a.drawImage(t,0,0,o.width,o.height),{dataUrl:o.toDataURL("image/jpeg",.88),width:o.width,height:o.height}}var jp=[["venetian","Venetian blind"],["roller","Roller shutter"],["linear","Linear (position = opening)"]],Zp=[["point","Bulb (point)"],["spot","Spot (aimed down)"],["strip","LED strip"],["emissive","Glow only (no cast light)"]],Jp=[["light","Light"],["media","Screen / TV"],["speaker","Speaker"],["appliance","Appliance"],["vacuum","Robot vacuum"],["marker","Marker only"]];function Gu(s,e){let{project:t,selected:n}=e;if(s.replaceChildren(),!n){s.append(Vu(e),em(e),tm(e));return}let i=t.find(n.collection,n.id);if(!i){s.append(Vu(e));return}let r={walls:nm,rooms:im,openings:sm,fixtures:rm,furniture:om};s.append(r[n.collection](i,e)),s.append(Qp(i,e))}function Qe(s,e,t,n,i){s.commit(e,r=>{let o=r[n].find(a=>a.id===t);o&&i(o,r)})}function Qp(s,{project:e,editor:t}){return $("div",{class:"panel-actions"},[nt("Delete",()=>{e.remove(t.selected.collection,s.id),t.select(null)},{class:"danger"})])}function Vu({project:s,onPlanImage:e}){let t=s.data,n=t.plan.scale?`1 px = ${(t.plan.scale*100).toFixed(2)} cm \xB7 ${(1/t.plan.scale).toFixed(1)} px/m`:"Not calibrated yet",i=$("input",{type:"file",accept:"image/png,image/jpeg,image/webp",class:"file"});return i.onchange=()=>{i.files?.[0]&&e(i.files[0]),i.value=""},Wt("Home",[Re("Name",vi(t.meta.name,r=>s.commit("name",o=>{o.meta.name=r}))),Re("Pack id",vi(t.meta.id,r=>s.commit("pack id",o=>{o.meta.id=r})),"Folder name under www/domoview/homes/"),Re("Author",vi(t.meta.author,r=>s.commit("author",o=>{o.meta.author=r}))),Re("License",qi(t.meta.license,[["CC0-1.0","CC0 (public domain)"],["CC-BY-4.0","CC BY 4.0"],["CC-BY-SA-4.0","CC BY-SA 4.0"],["","All rights reserved"]],r=>s.commit("license",o=>{o.meta.license=r})),"Applies if you share the pack"),Re("North",En(t.meta.north,r=>s.commit("north",o=>{o.meta.north=r}),{min:-180,max:180,step:1,format:r=>`${r}\xB0`}),"Rotation from the plan\u2019s up direction to geographic north"),Re("Ceiling height",rn(t.level.height,r=>s.commit("ceiling",o=>{o.level.height=r}),{step:.05,min:1.8,unit:"m"})),$("hr",{}),Re("Floor plan",i),Re("Plan opacity",En(Math.round(t.plan.opacity*100),r=>s.touch(o=>{o.plan.opacity=r/100}),{min:0,max:100,step:5,format:r=>`${r} %`})),$("p",{class:t.plan.scale?"note ok":"note warn"},n)])}function em({project:s}){let e=s.data,t=(n,i,r)=>Re(n,Kc(e.materials[i],o=>s.touch(a=>{a.materials[i]=o})),r);return Wt("Materials",[t("Walls","wall"),t("Floors","floor","Pick from a room photo below"),t("Furniture","furniture")])}function tm({project:s}){let e=s.data.camera;return Wt("Default view",[Re("Direction",En(e.azimuth,t=>s.touch(n=>{n.camera.azimuth=t}),{min:0,max:359,step:1,format:t=>`${t}\xB0`}),"Where the camera stands, clockwise from north"),Re("Tilt",En(e.elevation,t=>s.touch(n=>{n.camera.elevation=t}),{min:5,max:90,step:1,format:t=>`${t}\xB0`})),Re("Zoom",En(Math.round(e.zoom*100),t=>s.touch(n=>{n.camera.zoom=t/100}),{min:40,max:250,step:5,format:t=>`${t} %`})),Re("Cut away above",rn(e.clipAbove,t=>s.touch(n=>{n.camera.clipAbove=t}),{step:.1,min:0,unit:"m"}),"Hide geometry above this height. 0 disables the cut.")])}function nm(s,{project:e}){let t=e.data.plan.scale,n=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);return Wt("Wall",[$("p",{class:"note"},t?`Length ${(n*t).toFixed(2)} m`:`Length ${n.toFixed(0)} px (uncalibrated)`),Re("Thickness",rn(s.thickness,i=>Qe(e,"wall thickness",s.id,"walls",r=>{r.thickness=i}),{step:.01,min:.02,unit:"m"})),Re("Height",rn(s.height,i=>Qe(e,"wall height",s.id,"walls",r=>{r.height=i}),{step:.05,min:.2,unit:"m"})),Re("Exterior wall",zn(s.exterior,i=>Qe(e,"wall exterior",s.id,"walls",r=>{r.exterior=i})),"Exterior walls show their outward direction on the plan"),Re("Face the other way",zn(s.flip,i=>Qe(e,"wall facing",s.id,"walls",r=>{r.flip=i})),"Flip if the arrow points indoors; it decides where daylight enters")])}function im(s,{project:e}){let t=e.data.plan.scale,n=t?am(s.polygon)*t*t:null;return Wt("Room",[Re("Name",vi(s.name,i=>Qe(e,"room name",s.id,"rooms",r=>{r.name=i}))),n!==null?$("p",{class:"note"},`Floor area ${n.toFixed(1)} m\xB2`):null,Re("Outdoor",zn(s.outdoor,i=>Qe(e,"room outdoor",s.id,"rooms",r=>{r.outdoor=i})),"Balconies and terraces: lit by open sky, and they catch rain and snow")])}function sm(s,{project:e}){let t=e.data.rooms,n=t.length?$("div",{class:"checklist"},t.map(r=>zn(s.rooms.includes(r.id),o=>Qe(e,"opening rooms",s.id,"openings",a=>{a.rooms=o?[...new Set([...a.rooms,r.id])]:a.rooms.filter(c=>c!==r.id)}),r.name))):$("p",{class:"note warn"},"Outline a room first."),i=s.type!=="door";return Wt(i?"Window":"Door",[Re("Name",vi(s.name,r=>Qe(e,"opening name",s.id,"openings",o=>{o.name=r}),{placeholder:"Living room west"})),Re("Type",qi(s.type,[["window","Window"],["glass_door","Glazed door"],["door","Door"]],r=>Qe(e,"opening type",s.id,"openings",o=>{o.type=r,o.cover=r!=="door"&&o.cover}))),Re("Width",rn(s.width,r=>Qe(e,"opening width",s.id,"openings",o=>{o.width=r}),{step:.05,min:.1,unit:"m"})),Re("Sill height",rn(s.sill,r=>Qe(e,"opening sill",s.id,"openings",o=>{o.sill=r}),{step:.05,min:0,unit:"m"}),"Lower edge above the floor"),Re("Head height",rn(s.head,r=>Qe(e,"opening head",s.id,"openings",o=>{o.head=r}),{step:.05,min:.2,unit:"m"}),"Upper edge above the floor"),i?Re("Lights these rooms",n):null,i?Re("Centre post",rn(s.mullion??0,r=>Qe(e,"opening mullion",s.id,"openings",o=>{o.mullion=r>0?r:null}),{step:.05,min:0,unit:"m"}),"Distance from the centre to a vertical post that blocks light. 0 for none."):null,i?Re("Has a blind",zn(s.cover,r=>Qe(e,"opening cover",s.id,"openings",o=>{o.cover=r}))):null,i&&s.cover?Re("Blind type",qi(s.coverProfile,jp,r=>Qe(e,"cover profile",s.id,"openings",o=>{o.coverProfile=r}))):null,i&&s.cover?Re("Blind in front of glass",zn(s.coverInFront,r=>Qe(e,"cover side",s.id,"openings",o=>{o.coverInFront=r})),"For windows seen from outside in the default view"):null])}function rm(s,{project:e}){let t=e.data.rooms,n=$("div",{class:"emitters"},s.emitters.map((i,r)=>$("div",{class:"emitter"},[$("span",{class:"emitter-index"},`#${r+1}`),rn(i.height,o=>Qe(e,"bulb height",s.id,"fixtures",a=>{a.emitters[r].height=o}),{step:.05,min:0,unit:"m"}),qi(i.type,Zp,o=>Qe(e,"bulb type",s.id,"fixtures",a=>{a.emitters[r].type=o})),s.emitters.length>1?nt("\xD7",()=>Qe(e,"remove bulb",s.id,"fixtures",o=>{o.emitters.splice(r,1)}),{class:"ghost tiny",title:"Remove this bulb"}):null])));return Wt("Fixture",[Re("Name",vi(s.name,i=>Qe(e,"fixture name",s.id,"fixtures",r=>{r.name=i}),{placeholder:"Living room pendant"})),Re("Kind",qi(s.kind,Jp,i=>Qe(e,"fixture kind",s.id,"fixtures",r=>{r.kind=i}))),Re("Room",qi(s.room||"",[["","\u2014"],...t.map(i=>[i.id,i.name])],i=>Qe(e,"fixture room",s.id,"fixtures",r=>{r.room=i||null}))),Re("Colour",Kc(s.color,i=>Qe(e,"fixture colour",s.id,"fixtures",r=>{r.color=i})),"Used when the bound entity reports no colour"),Re("Brightness",rn(s.lumens,i=>Qe(e,"fixture lumens",s.id,"fixtures",r=>{r.lumens=i}),{step:50,min:10,unit:"lm"})),Re("Reach",rn(s.range,i=>Qe(e,"fixture range",s.id,"fixtures",r=>{r.range=i}),{step:.5,min:.5,unit:"m"})),Re("Casts shadows",zn(s.shadow,i=>Qe(e,"fixture shadow",s.id,"fixtures",r=>{r.shadow=i})),"Costly in the live renderer; keep it to a couple of hero lights"),$("h4",{},"Bulbs"),n,$("p",{class:"note"},"Shift-click on the plan adds another bulb to this fixture.")])}function om(s,{project:e}){return Wt("Furniture",[Re("Name",vi(s.name,t=>Qe(e,"furniture name",s.id,"furniture",n=>{n.name=t}))),Re("Base height",rn(s.base,t=>Qe(e,"furniture base",s.id,"furniture",n=>{n.base=t}),{step:.05,min:0,unit:"m"})),Re("Top height",rn(s.top,t=>Qe(e,"furniture top",s.id,"furniture",n=>{n.top=t}),{step:.05,min:.02,unit:"m"})),Re("Solid geometry",zn(s.solid,t=>Qe(e,"furniture solid",s.id,"furniture",n=>{n.solid=t})),"Include a box for it in the exported model"),Re("Blocks sunlight",zn(s.occluder,t=>Qe(e,"furniture occluder",s.id,"furniture",n=>{n.occluder=t})),"Casts shadows in the baked renderer")])}function am(s){let e=0;for(let t=0,n=s.length-1;t<s.length;n=t++)e+=s[n][0]*s[t][1]-s[t][0]*s[n][1];return Math.abs(e)/2}function Wu(s,{project:e,editor:t}){let n=e.data;s.replaceChildren();let i=[["rooms","Rooms",n.rooms,r=>r.name],["openings","Openings",n.openings,r=>r.name||r.id],["fixtures","Fixtures",n.fixtures,r=>r.name||r.id],["furniture","Furniture",n.furniture,r=>r.name]];for(let[r,o,a,c]of i){if(!a.length)continue;let l=$("ul",{class:"outline-list"},a.map(h=>{let u=t.selected?.collection===r&&t.selected.id===h.id;return $("li",{},[$("button",{type:"button",class:u?"active":"",textContent:c(h),onClick:()=>t.select(r,h.id)})])}));s.append($("div",{class:"outline-group"},[$("h4",{},`${o} (${a.length})`),l]))}s.children.length||s.append($("p",{class:"note"},"Nothing traced yet."))}function Xu(s){if(!s.plan.scale)return"Calibrate the scale to see real dimensions.";let e=new yi(s),t=[];for(let a of s.walls)t.push(e.point(a.a),e.point(a.b));if(!t.length)return"No walls traced yet.";let n=t.map(a=>a[0]),i=t.map(a=>a[1]),r=Math.max(...n)-Math.min(...n),o=Math.max(...i)-Math.min(...i);return`Traced extent ${r.toFixed(2)} m \xD7 ${o.toFixed(2)} m`}var cm=1400,Uo=class{constructor({project:e,container:t,onPickColor:n}){this.project=e,this.container=t,this.onPickColor=n,this.picking=null}async add(e){let t=[];for(let n of e)if(n.type.startsWith("image/"))try{let i=await Do(n),{dataUrl:r,width:o,height:a}=await No(i,cm);t.push({id:`photo_${Math.random().toString(36).slice(2,9)}`,name:n.name.replace(/\.[^.]+$/,""),dataUrl:r,width:o,height:a,room:null,include:!1,note:""})}catch(i){Ot(i.message,"error")}t.length&&this.project.commit("add photos",n=>n.photos.push(...t))}render(){let e=this.project.data;this.container.replaceChildren();let t=$("input",{type:"file",accept:"image/*",multiple:!0,class:"file"});if(t.onchange=()=>{t.files?.length&&this.add([...t.files]),t.value=""},this.container.append($("div",{class:"photo-toolbar"},[$("label",{class:"field-label"},"Room photos"),t])),!e.photos.length){this.container.append($("p",{class:"note"},"Add photos of each room. Click a photo to sample a colour for the walls, floor or a lamp."));return}let n=$("div",{class:"photo-grid"});for(let i of e.photos)n.append(this.card(i));this.container.append(n),this.container.append($("p",{class:"note"},'Photos are kept in the project file. Only those marked "include" are written into an exported pack.'))}card(e){let t=this.project.data,n=$("img",{src:e.dataUrl,alt:e.name,loading:"lazy"});n.onclick=o=>this.sample(o,n,e);let i=$("select",{class:"photo-room"},[$("option",{value:"",textContent:"Unassigned"}),...t.rooms.map(o=>$("option",{value:o.id,textContent:o.name,selected:o.id===e.room}))]);i.onchange=()=>this.update(e.id,o=>{o.room=i.value||null});let r=$("input",{type:"checkbox",checked:e.include});return r.onchange=()=>this.update(e.id,o=>{o.include=r.checked}),$("figure",{class:"photo-card"},[n,$("figcaption",{},[i,$("label",{class:"check tiny"},[r,$("span",{},"include")]),nt("\xD7",()=>{this.project.commit("remove photo",o=>{o.photos=o.photos.filter(a=>a.id!==e.id)})},{class:"ghost tiny",title:"Remove photo"})])])}update(e,t){this.project.commit("photo",n=>{let i=n.photos.find(r=>r.id===e);i&&t(i)})}sample(e,t,n){let i=t.getBoundingClientRect(),r=Math.round((e.clientX-i.left)/i.width*n.width),o=Math.round((e.clientY-i.top)/i.height*n.height),c=$("canvas",{width:n.width,height:n.height}).getContext("2d",{willReadFrequently:!0});c.drawImage(t,0,0,n.width,n.height);let l=4,h=Math.max(0,r-l),u=Math.max(0,o-l),f=Math.min(n.width-h,l*2+1),d=Math.min(n.height-u,l*2+1);if(f<=0||d<=0)return;let m=c.getImageData(h,u,f,d).data,_=0,g=0,p=0,b=0;for(let x=0;x<m.length;x+=4)m[x+3]<8||(_+=m[x],g+=m[x+1],p+=m[x+2],b+=1);if(!b)return;let v=zu([_/b,g/b,p/b]);this.onPickColor(v,n)}};function Yu(s,{project:e,selected:t,onDone:n}){let i=[["wall","Walls"],["floor","Floors"],["furniture","Furniture"]];return $("div",{class:"colour-menu"},[$("span",{class:"swatch",style:{background:s}}),$("code",{},s),...i.map(([o,a])=>nt(a,()=>{e.commit(`${o} colour`,c=>{c.materials[o]=s}),n()},{class:"ghost tiny"})),t?.collection==="fixtures"?nt("Selected lamp",()=>{e.commit("lamp colour",o=>{let a=o.fixtures.find(c=>c.id===t.id);a&&(a.color=s)}),n()},{class:"ghost tiny"}):null,nt("Cancel",n,{class:"ghost tiny"})])}var Oo=1,lm={light:["light","switch"],media:["media_player"],cover:["cover"],sensor:["sensor","binary_sensor"],appliance:["switch","sensor","binary_sensor"],vacuum:["vacuum"],speaker:["media_player"],marker:[]},hm={linear:{name:"Linear",stops:[[0,0],[100,1]]},venetian:{name:"Venetian (typical)",stops:[[0,.02],[20,.04],[40,.12],[50,.27],[60,.34],[70,.4],[80,.49],[100,1]],slats:{spacing:.064,maxAperture:.32,closedStops:[[0,0],[10,.08],[20,.16],[21,0]]}},roller:{name:"Roller shutter",stops:[[0,0],[100,1]]}},Ms=class extends Error{constructor(e,t){super(e),this.name="PackError",this.detail=t}};function Mi(s,e){return e?/^[a-z][a-z0-9+.-]*:/i.test(e)||e.startsWith("//")||e.startsWith("/")?e:`${s.replace(/\/+$/,"")}/${e.replace(/^\.?\//,"")}`:null}function qu(s,e=".",t={}){if(!s||typeof s!="object")throw new Ms("home.json is not an object");let n=s.pack||{};if(n.schema!==Oo)throw new Ms(`Unsupported Home Pack schema ${n.schema??"(missing)"}; this build reads version ${Oo}`);if(!s.model?.url&&!s.baked?.day)throw new Ms("home.json needs either model.url or a baked section");let i=t.variant&&t.variant!=="base"?t.variant:null,r=(s.variants||[]).map(S=>({...S})),o=i&&r.find(S=>S.id===i)||null,a=dm(s.levels),c=new Map(a.map(S=>[S.id,S])),l=fm(s.rooms,a),h=new Map(l.map(S=>[S.id,S])),u=pm(s.walls,c),f=new Map(u.map(S=>[S.id,S])),d={...hm,...s.coverProfiles||{}},m=mm(s.openings,f,h,c,d),_=gm(s.fixtures,h,i),g=_m(s.model?.bounds,{rooms:l,openings:m,fixtures:_}),p=xm(s.cameras,g),b=Mi(e,o?.model||s.model?.url),v=o?.baked?um(s.baked,o.baked):s.baked,x=ym(v,e,_);return{root:e,meta:{id:n.id||"home",name:n.name||"Home",version:n.version||"0",author:n.author||"",license:n.license||"",description:n.description||"",units:"m",north:Number(n.north)||0,createdWith:n.createdWith||""},model:{url:b,up:s.model?.up==="Y"?"Y":"Z",bounds:g,center:Yc(g),span:Bu(g),exposure:Number(s.model?.exposure)||1,environment:{skyIntensity:s.model?.environment?.skyIntensity??1,groundColor:s.model?.environment?.groundColor||[92,88,80],nightAmbient:s.model?.environment?.nightAmbient??.04}},cameras:p,levels:a,rooms:l,walls:u,openings:m,coverProfiles:d,fixtures:_,occluders:(s.occluders||[]).map((S,T)=>({name:S.name||`occluder_${T}`,min:S.min.slice(),max:S.max.slice()})),shadowCasters:(s.shadowCasters||[]).map((S,T)=>({id:S.id||`caster_${T}`,a:S.a.slice(),b:S.b.slice(),heights:S.heights||[],postSpacing:S.postSpacing??.6,postRadius:S.postRadius??.023,topHeight:S.topHeight??1})),variants:r,variant:i,baked:x,bindings:{...s.bindings||{}},roomById:h,fixtureById:new Map(_.map(S=>[S.id,S])),openingById:new Map(m.map(S=>[S.id,S])),windows:m.filter(S=>S.admitsLight),lights:_.filter(S=>S.kind==="light")}}function um(s,e){if(!s)return null;let t=n=>n&&`${e.replace(/\/+$/,"")}/${n.split("/").pop()}`;return{...s,day:t(s.day),night:t(s.night),gbuffer:s.gbuffer&&{...s.gbuffer,position:t(s.gbuffer.position),normal:t(s.gbuffer.normal)},masks:s.masks&&{exterior:t(s.masks.exterior),glass:t(s.masks.glass)},lights:Object.fromEntries(Object.entries(s.lights||{}).map(([n,i])=>[n,`${e.replace(/\/+$/,"")}/lights/${i.split("/").pop()}`]))}}function dm(s){return s?.length?s.map((e,t)=>({id:e.id||`level_${t}`,name:e.name||e.id||`Level ${t+1}`,elevation:Number(e.elevation)||0,height:Number(e.height)||2.5})):[{id:"ground",name:"Ground floor",elevation:0,height:2.5}]}function fm(s,e){let t=e[0].id;return(s||[]).map((n,i)=>{let r=n.polygon?.length>=3?Fu(n.polygon.map(o=>o.slice())):null;return{id:n.id||`room_${i}`,name:n.name||n.id||`Room ${i+1}`,level:n.level||t,polygon:r,label:n.label?.slice()||(r?Co(r):null),outdoor:!!n.outdoor}})}function pm(s,e){return(s||[]).map((t,n)=>{let i=t.a.slice(),r=t.b.slice(),o=Yi(i,r,!!t.flip),a=e.get(t.level)||e.values().next().value;return{id:t.id||`wall_${n}`,a:i,b:r,thickness:t.thickness??.12,height:t.height??a?.height??2.5,level:t.level||a?.id,exterior:!!t.exterior,flip:!!t.flip,...o}})}function mm(s,e,t,n,i){return(s||[]).map((r,o)=>{let a=r.id||`opening_${o}`,c=r.wall?e.get(r.wall):null;if(r.wall&&!c)throw new Ms(`Opening ${a} references unknown wall ${r.wall}`);let l=n.get(c?.level)||n.values().next().value,h=Number(r.width)||1,u=r.sill??(r.type==="door"||r.type==="glass_door"?0:.9),f=r.head??Math.min((l?.height??2.5)-.1,u+1.4),d=null,m=null,_=null,g=0,p=h;if(c){let x=Number(r.offset)||0;d=c.a.slice(),m=c.tangent.slice(),_=r.normal?.slice()||c.normal.slice(),g=x-h/2,p=x+h/2}else r.normal&&(_=r.normal.slice());let b=(r.rooms||[]).filter(x=>t.has(x)),v=r.cover?.profile||"linear";return{id:a,type:r.type||"window",name:r.name||a,wall:c?.id||null,level:l?.id,levelElevation:l?.elevation??0,offset:Number(r.offset)||0,width:h,sill:u,head:f,origin:d,tangent:m,normal:_,start:g,end:p,mullion:r.mullion??null,rooms:b,roomPolygons:b.map(x=>t.get(x).polygon).filter(Boolean),glass:r.glass?{min:r.glass.min.slice(),max:r.glass.max.slice()}:null,cover:{profile:v,profileData:i[v]||i.linear,inFront:!!r.cover?.inFront,supported:!!r.cover},outside:!!r.outside,admitsLight:r.type!=="door",spanStart:c?Wc({a:c.a,tangent:c.tangent},g):null,spanEnd:c?Wc({a:c.a,tangent:c.tangent},p):null}})}function gm(s,e,t){return(s||[]).filter(n=>!n.variant||n.variant===t).map((n,i)=>{let r=n.kind||"light",o=(n.emitters||[]).map(c=>({position:c.position.slice(),type:c.type||"point",target:c.target?.slice()||null,intensity:c.intensity??1,radius:c.radius??.06,angle:c.angle??null,penumbra:c.penumbra??.4})),a=n.room?e.get(n.room):null;return{id:n.id||`fixture_${i}`,name:n.name||n.id||`Fixture ${i+1}`,kind:r,room:a?.id||null,roomName:a?.name||"",node:n.node||null,domains:n.domains?.length?n.domains:lm[r]||[],emitters:o,light:{color:n.light?.color||null,kelvin:n.light?.kelvin??null,lumens:n.light?.lumens??600,range:n.light?.range??6,shadow:!!n.light?.shadow},dimmable:n.dimmable??r==="light",screen:n.screen?.slice()||null,render:{bulb:n.render?.bulb||(r==="light"?"glow":"none"),scale:n.render?.scale??1,emissiveNodes:n.render?.emissiveNodes||(n.node?[n.node]:[])},variant:n.variant||null}})}function _m(s,{rooms:e,openings:t,fixtures:n}){if(s?.min&&s?.max)return{min:s.min.slice(),max:s.max.slice()};let i=[1/0,1/0,0],r=[-1/0,-1/0,2.5],o=(a,c,l)=>{Number.isFinite(a)&&(i[0]=Math.min(i[0],a),r[0]=Math.max(r[0],a)),Number.isFinite(c)&&(i[1]=Math.min(i[1],c),r[1]=Math.max(r[1],c)),Number.isFinite(l)&&(i[2]=Math.min(i[2],l),r[2]=Math.max(r[2],l))};for(let a of e)for(let c of a.polygon||[])o(c[0],c[1],void 0);for(let a of t)a.spanStart&&o(a.spanStart[0],a.spanStart[1],a.head),a.spanEnd&&o(a.spanEnd[0],a.spanEnd[1],a.sill);for(let a of n)for(let c of a.emitters)o(c.position[0],c.position[1],c.position[2]);return Number.isFinite(i[0])||(i[0]=i[1]=-5,r[0]=r[1]=5),{min:i,max:r}}function xm(s,e){let t=Yc(e),n=(s?.length?s:[{id:"iso_sw",name:"Isometric",azimuth:225,elevation:40,default:!0}]).map((i,r)=>({id:i.id||`camera_${r}`,name:i.name||i.id||`View ${r+1}`,type:i.type==="perspective"?"perspective":"orthographic",azimuth:Number(i.azimuth)||0,elevation:ke(Number(i.elevation)||40,0,90),target:i.target?.slice()||[t[0],t[1],e.min[2]+1.2],zoom:i.zoom>0?i.zoom:1,fov:i.fov??35,clip:i.clip?.above!=null?{above:Number(i.clip.above)}:null,default:!!i.default}));return n.some(i=>i.default)||(n[0].default=!0),n}function ym(s,e,t){if(!s?.day||!s?.night)return null;let n=Number(s.size)||1024,i={};for(let r of t){let o=s.lights?.[r.id];o&&(i[r.id]=Mi(e,o))}return{size:n,camera:s.camera||null,day:Mi(e,s.day),night:Mi(e,s.night),gbuffer:s.gbuffer?.position&&s.gbuffer?.normal?{position:Mi(e,s.gbuffer.position),normal:Mi(e,s.gbuffer.normal),size:Number(s.gbuffer.size)||n}:null,masks:{exterior:Mi(e,s.masks?.exterior),glass:Mi(e,s.masks?.glass)},lights:i,surfaces:{wet:(s.surfaces?.wet||[]).map((r,o)=>({id:r.id||`wet_${o}`,polygon:r.polygon.map(a=>a.slice()),height:r.height??0}))}}}var kt=Math.PI/180,vm=2451545,bs=23.4397*kt;function Ku(s){return s.getTime()/864e5+24405875e-1-vm}function ju(s,e){return(280.16+360.9856235*s)*kt+e}function Zu(s){return s<-.05?s:s+2967e-7/Math.tan(s+.00312536/(s+.08901179))}function Ju(s,e,t){let n=Math.asin(Math.sin(e)*Math.sin(t)+Math.cos(e)*Math.cos(t)*Math.cos(s));return{azimuth:(Math.atan2(Math.sin(s),Math.cos(s)*Math.sin(e)-Math.tan(t)*Math.cos(e))/kt+540)%360,altitude:n}}function jc(s,e,t){let n=Ku(s),i=(357.5291+.98560028*n)*kt,r=i+(1.9148*Math.sin(i)+.02*Math.sin(2*i)+3e-4*Math.sin(3*i))*kt+102.9372*kt+Math.PI,o=Math.asin(Math.sin(bs)*Math.sin(r)),a=Math.atan2(Math.sin(r)*Math.cos(bs),Math.cos(r)),c=ju(n,t*kt)-a,{azimuth:l,altitude:h}=Ju(c,e*kt,o);return{azimuth:l,elevation:Zu(h)/kt}}function Qu(s,e,t){let n=Ku(s),i=(218.316+13.176396*n)*kt,r=(134.963+13.064993*n)*kt,o=(93.272+13.22935*n)*kt,a=i+6.289*kt*Math.sin(r),c=5.128*kt*Math.sin(o),l=Math.atan2(Math.sin(a)*Math.cos(bs)-Math.tan(c)*Math.sin(bs),Math.cos(a)),h=Math.asin(Math.sin(c)*Math.cos(bs)+Math.cos(c)*Math.sin(bs)*Math.sin(a)),u=ju(n,t*kt)-l,{azimuth:f,altitude:d}=Ju(u,e*kt,h);return{azimuth:f,elevation:Zu(d)/kt}}var $u={new_moon:0,waxing_crescent:.16,first_quarter:.5,waxing_gibbous:.82,full_moon:1,waning_gibbous:.82,last_quarter:.5,waning_crescent:.16};function ed(s,e=null){if(e&&Object.hasOwn($u,e))return $u[e];let t=Date.UTC(2e3,0,6,18,14),n=29.530588853*864e5,i=((s.getTime()-t)%n+n)%n/n;return(1-Math.cos(2*Math.PI*i))/2}function td(s){return s>=25?[255,244,224]:s>=15?[255,232,196]:s>=6?[255,214,162]:[255,190,138]}var nd=[172,200,255];var Mm=.3;function id(s,e){let t=Math.max(0,s.head-s.sill);if(!Number.isFinite(e))return t;let n=ke(Xc(s.cover.profileData.stops,ke(e,0,100)),0,1);return t*n}function sd(s,e){return s.levelElevation+s.sill+id(s,e)}function Zc(s,e,t){let n=s.cover.profileData.slats;return n?Number.isFinite(t)?ke(t/100*(n.maxAperture??.32),0,1):n.closedStops?.length?ke(Xc(n.closedStops,ke(e,0,100)),0,1):0:0}function rd(s,e={},t=Mm){let n=new Map;for(let i of s.rooms){let r=s.windows.filter(a=>a.rooms.includes(i.id));if(!r.length||i.outdoor){n.set(i.id,1);continue}let o=0;for(let a of r){let c=e[a.id];if(!c){o+=1;continue}let l=Math.max(1e-6,a.head-a.sill),h=ke(id(a,c.position)/l,0,1),u=Zc(a,c.position,c.tilt);o+=h+(1-h)*u*.55}n.set(i.id,t+(1-t)*(o/r.length))}return n}var bm=new Set(["unknown","unavailable",""]),Sm={"clear-night":0,sunny:0,partlycloudy:45,cloudy:85,windy:25,"windy-variant":45,rainy:95,pouring:100,snowy:95,"snowy-rainy":95,fog:100,hail:100,lightning:100,"lightning-rainy":100,exceptional:50},wm=new Set(["rainy","pouring","lightning-rainy","snowy-rainy","hail"]),Tm=new Set(["snowy","snowy-rainy"]);function on(s){return!!s&&!bm.has(String(s.state).toLowerCase())}function ft(s){let e=Number(s);return Number.isFinite(e)?e:null}function od(s){let e=ke(s,1500,12e3)/100,t,n,i;return e<=66?(t=255,n=99.47*Math.log(e)-161.12):(t=329.7*(e-60)**-.1332,n=288.12*(e-60)**-.0755),e>=66?i=255:e<=19?i=0:i=138.52*Math.log(e-10)-305.04,[ke(t,0,255),ke(n,0,255),ke(i,0,255)].map(Math.round)}var ad={enabled:!1,date:null,hour:16,cloud:0,brightness:100,coverPosition:100,weather:"dry",moonPhase:"auto",windowOpen:!1,latitude:51,longitude:7,on:{},levels:{}},Fo=class{constructor(e,t={},n=ad){this.pack=e,this.config=t,this.preview={...ad,...n},this.hass=null,this.pendingBrightness=null,this.lastBrightness={},this.lastGoodCover={},this.sources={}}setHass(e){if(this.hass=e,this.pendingBrightness){let{id:t,value:n}=this.pendingBrightness,i=e?.states?.[this.entityFor(t)],r=Math.round((ft(i?.attributes?.brightness)??255)/255*100);i?.state==="on"&&Math.abs(r-n)<=1&&(this.pendingBrightness=null)}}setPreview(e){this.preview={...this.preview,...e}}entityFor(e){return String(this.config.entities?.[e]??"").trim()||null}stateOf(e){let t=this.entityFor(e);return t&&this.hass?.states?.[t]||null}get previewing(){return!!this.preview.enabled}get latitude(){return this.previewing?ft(this.preview.latitude)??51:ft(this.hass?.config?.latitude)??ft(this.config.latitude)??51}get longitude(){return this.previewing?ft(this.preview.longitude)??7:ft(this.hass?.config?.longitude)??ft(this.config.longitude)??7}now(){if(!this.previewing)return new Date;let e=this.preview.date||new Date().toISOString().slice(0,10),[t,n,i]=e.split("-").map(Number),r=Math.floor(this.preview.hour),o=Math.round((this.preview.hour-r)*60);return new Date(t,(n||1)-1,i||1,r,o)}sun(){if(this.previewing)return jc(this.now(),this.latitude,this.longitude);let e=this.hass?.states?.[this.config.sun_entity||"sun.sun"],t=ft(e?.attributes?.azimuth),n=ft(e?.attributes?.elevation);return t!==null&&n!==null?{azimuth:t,elevation:n}:jc(new Date,this.latitude,this.longitude)}moon(){let e=this.now(),t=Qu(e,this.latitude,this.longitude),n=this.config.moon_entity?this.hass?.states?.[this.config.moon_entity]:null,i=this.previewing&&this.preview.moonPhase==="full"?1:this.previewing&&this.preview.moonPhase==="new"?0:ed(e,on(n)?n.state:null);return{...t,illumination:i}}weatherEntity(){let e=this.hass?.states||{};if(this.config.weather_entity){let n=e[this.config.weather_entity];return on(n)?n:null}if(on(e["weather.home"]))return e["weather.home"];let t=Object.keys(e).sort().find(n=>n.startsWith("weather.")&&on(e[n]));return t?e[t]:null}cloudCover(){if(this.previewing)return this.sources.cloud="preview",ke(ft(this.preview.cloud)??0,0,100);let e=this.config.cloud_entity?this.hass?.states?.[this.config.cloud_entity]:null,t=on(e)?ft(e.state):null;if(t!==null)return this.sources.cloud="sensor",ke(t,0,100);let n=this.weatherEntity(),i=ft(n?.attributes?.cloud_coverage);return i!==null?(this.sources.cloud="weather",ke(i,0,100)):(this.sources.cloud=n?"condition":"assumed",Sm[n?.state]??50)}weather(){if(this.previewing){let m=this.preview.weather,_=m==="rain"||m==="snow"?.8:m==="mixed"?.55:0;return{rain:m==="rain"||m==="mixed"?_:0,snow:m==="snow"||m==="mixed"?_:0,wetGround:m==="rain"||m==="mixed"?.8:0,snowCover:m==="snow"||m==="mixed"?.8:0,wind:.15}}let e=this.hass?.states||{},t=this.weatherEntity(),n=t?.state,i=wm.has(n)?n==="pouring"?1:.65:0,r=Tm.has(n)?.65:0,o=this.config.rain_entity?e[this.config.rain_entity]:null;on(o)&&(i=["on","true","rainy","wet"].includes(String(o.state).toLowerCase())?.75:0);let a=this.config.snow_entity?e[this.config.snow_entity]:null;on(a)&&(r=["on","true","snowy"].includes(String(a.state).toLowerCase())?.75:0);let c=this.config.precipitation_rate_entity?e[this.config.precipitation_rate_entity]:null,l=on(c)?ft(c.state):null;if(l!==null&&l>=0)if(l===0)i=0,r=0;else{let m=ke(l/5,.18,1);i&&(i=m),r&&(r=m),!i&&!r&&(i=m)}let h=this.config.wind_speed_entity?e[this.config.wind_speed_entity]:null,u=ft(on(h)?h.state:t?.attributes?.wind_speed)??0,f=this.config.snow_depth_entity?e[this.config.snow_depth_entity]:null,d=on(f)?ft(f.state):null;return{rain:i,snow:r,wetGround:i,snowCover:d!==null&&d>=0?ke(d/5,0,1):r,wind:ke(u/35,0,1)}}daylight(e=this.sun(),t=this.weather()){return ke((e.elevation+6)/10,0,1)*(1-t.rain*.14-t.snow*.08)}directSun(e=this.sun(),t=this.cloudCover()){if(e.elevation<=0)return this.sources.direct="below-horizon",0;let n=this.hass?.states||{};for(let[i,r,o]of[["irradiance_entity",850,"irradiance"],["illuminance_entity",9e4,"illuminance"]]){let a=this.config[i]?n[this.config[i]]:null,c=on(a)?ft(a.state):null;if(c!==null&&c>=0){let l=r*Math.max(.1,Math.sin(e.elevation*Math.PI/180));return this.sources.direct=o,ke(c/l,0,1)}}return this.sources.direct=this.sources.cloud||"condition",ke((85-t)/65,0,1)}covers(){let e={};for(let t of this.pack.openings){if(this.previewing){t.cover.supported&&(e[t.id]={position:ke(ft(this.preview.coverPosition)??100,0,100),tilt:null});continue}let n=this.config.covers?.[t.id];if(!n)continue;let i=this.hass?.states?.[n];if(!on(i)){this.lastGoodCover[t.id]&&(e[t.id]=this.lastGoodCover[t.id]);continue}let r=ft(i.attributes?.current_position),o=r!==null?ke(r,0,100):i.state==="closed"?0:i.state==="open"?100:this.lastGoodCover[t.id]?.position??null;if(o===null)continue;let a=ft(i.attributes?.current_tilt_position),c={position:o,tilt:a===null?null:ke(a,0,100)};e[t.id]=c,this.lastGoodCover[t.id]=c}return e}openWindows(){let e=new Set;for(let t of this.pack.openings){if(this.previewing){this.preview.windowOpen&&t.admitsLight&&e.add(t.id);continue}let n=this.config.window_sensors?.[t.id],i=n?this.hass?.states?.[n]:null;on(i)&&["on","open","tilted"].includes(String(i.state).toLowerCase())&&e.add(t.id)}return e}roomDaylight(e=this.covers()){return rd(this.pack,e)}climate(){let e=new Map;for(let t of this.pack.rooms){let n=this.config.rooms?.[t.id];if(!n)continue;let i=this.readClimate(n.temperature,"temperature"),r=this.readClimate(n.humidity,"humidity");i===null&&r===null||e.set(t.id,{temperature:i,humidity:r})}return e}readClimate(e,t){let n=e?this.hass?.states?.[e]:null;if(!on(n))return null;let i=e.startsWith("climate.")?n.attributes?.[t==="temperature"?"current_temperature":"current_humidity"]:n.state;return ft(i)}isOn(e){if(this.previewing)return!!this.preview.on[e.id];if(this.pendingBrightness?.id===e.id)return!0;let t=this.stateOf(e.id);return t?e.kind==="media"||e.kind==="speaker"?!["off","standby","idle","unavailable","unknown"].includes(String(t.state).toLowerCase()):String(t.state).toLowerCase()==="on":!1}level(e){if(!this.isOn(e))return 0;if(e.kind==="media"||e.kind==="speaker")return this.previewing?ke(this.preview.brightness/100):.85;if(this.previewing)return ke((this.preview.levels[e.id]??this.preview.brightness)/100);if(this.pendingBrightness?.id===e.id)return ke(this.pendingBrightness.value/100);let t=ft(this.stateOf(e.id)?.attributes?.brightness);return t===null?1:ke(t/255)}color(e){let t=this.stateOf(e.id)?.attributes||{};if(Array.isArray(t.rgb_color)&&t.rgb_color.length===3)return t.rgb_color.map(i=>ke(ft(i)??0,0,255));let n=ft(t.color_temp_kelvin);return n!==null?od(n):e.light.color?e.light.color:e.light.kelvin?od(e.light.kelvin):e.kind==="media"?[176,208,255]:[255,221,164]}canDim(e){if(e.kind!=="light")return!1;if(this.previewing)return!0;let t=this.entityFor(e.id);if(!t?.startsWith("light."))return!1;let n=this.hass?.states?.[t]?.attributes||{},i=n.supported_color_modes;return Array.isArray(i)?i.some(r=>!["onoff","unknown"].includes(r)):ft(n.brightness)!==null}brightnessPercent(e){if(this.previewing)return this.preview.levels[e.id]??this.preview.brightness;if(this.pendingBrightness?.id===e.id)return this.pendingBrightness.value;let t=this.stateOf(e.id),n=ft(t?.attributes?.brightness);return t?.state==="on"&&n>0&&(this.lastBrightness[e.id]=Math.round(n/255*100)),this.lastBrightness[e.id]??100}activeEmitters(){return this.pack.fixtures.filter(e=>(e.kind==="light"||e.kind==="media")&&(this.previewing||this.entityFor(e.id))).filter(e=>this.isOn(e)).map(e=>({fixture:e,id:e.id,level:this.level(e),color:this.color(e)}))}snapshot(){let e=this.sun(),t=this.weather(),n=this.cloudCover(),i=this.daylight(e,t),r=this.covers(),o=this.moon(),a=Math.max(t.rain,t.snow),c=this.directSun(e,n)*i*ke(e.elevation/7,0,1)*(1-a),l=.38*ke(o.illumination)*Math.max(0,1-n/100)**2*(1-ke(i))*(1-a);return{time:this.now(),sun:e,moon:o,cloud:n,weather:t,daylight:i,covers:r,direct:c,moonStrength:l,sunColor:td(e.elevation),moonColor:nd,roomDaylight:this.roomDaylight(r),openWindows:this.openWindows(),climate:this.climate(),emitters:this.activeEmitters(),sources:{...this.sources}}}async toggle(e){if(this.previewing)return this.preview.on[e.id]=!this.preview.on[e.id],{ok:!0};let t=this.entityFor(e.id);if(!t||!this.hass?.states?.[t])return{ok:!1,reason:"unbound"};let n=t.split(".")[0];if(!["light","switch","input_boolean","fan","media_player"].includes(n))return{ok:!1,reason:"domain",domain:n};let i=this.isOn(e);this.pendingBrightness?.id===e.id&&(this.pendingBrightness=null);let r=i?"turn_off":"turn_on";return await this.hass.callService(n,r,{entity_id:t}),{ok:!0}}setBrightness(e,t){let n=ke(Math.round(t),1,100);if(this.previewing){this.preview.levels[e.id]=n,this.preview.on[e.id]=!0;return}this.pendingBrightness={id:e.id,value:n},clearTimeout(this._pendingTimer),this._pendingTimer=setTimeout(()=>{this.pendingBrightness?.id===e.id&&(this.pendingBrightness=null)},5e3)}async sendBrightness(e){let t=this.pendingBrightness;if(!t||t.id!==e.id||this.previewing)return{ok:!0};let n=this.entityFor(e.id);if(!n?.startsWith("light."))return{ok:!1,reason:"not-dimmable"};let i=`${n}:${t.value}`,r=Date.now();return i===this._lastSent?.key&&r-this._lastSent.time<300?{ok:!0}:(this._lastSent={key:i,time:r},await this.hass.callService("light","turn_on",{entity_id:n,brightness_pct:t.value}),{ok:!0})}async setCover(e,t){if(this.previewing)return this.preview.coverPosition=ke(t,0,100),{ok:!0};let n=this.config.covers?.[e.id];return n?(await this.hass.callService("cover","set_cover_position",{entity_id:n,position:ke(Math.round(t),0,100)}),{ok:!0}):{ok:!1,reason:"unbound"}}showMoreInfo(e,t){let n=this.entityFor(t);return n?(e.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:n},bubbles:!0,composed:!0})),!0):!1}};var Oi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Fi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Kd=0,Vl=1,jd=2;var Gl=1,Oa=2,Kn=3,Ln=0,en=1,At=2,mi=0,Qi=1,uo=2,Wl=3,Xl=4,Zd=5,Ci=100,Jd=101,Qd=102,ef=103,tf=104,nf=200,sf=201,rf=202,of=203,da=204,fa=205,af=206,cf=207,lf=208,hf=209,uf=210,df=211,ff=212,pf=213,mf=214,Fa=0,Ba=1,ka=2,es=3,za=4,Ha=5,Va=6,Ga=7,Yl=0,gf=1,_f=2,gi=0,xf=1,yf=2,vf=3,Wa=4,Mf=5,bf=6,Sf=7,Rl="attached",wf="detached",ql=300,cs=301,ls=302,Xa=303,Ya=304,fo=306,Vn=1e3,bn=1001,Ii=1002,It=1003,er=1004;var _i=1005;var zt=1006,Bi=1007;var _n=1008;var Fn=1009,$l=1010,Kl=1011,tr=1012,qa=1013,ki=1014,wn=1015,nr=1016,$a=1017,Ka=1018,ir=1020,jl=35902,Zl=35899,Jl=1021,Ql=1022,tn=1023,ks=1026,sr=1027,ja=1028,Za=1029,eh=1030,Ja=1031;var Qa=1033,po=33776,mo=33777,go=33778,_o=33779,ec=35840,tc=35841,nc=35842,ic=35843,sc=36196,rc=37492,oc=37496,ac=37808,cc=37809,lc=37810,hc=37811,uc=37812,dc=37813,fc=37814,pc=37815,mc=37816,gc=37817,_c=37818,xc=37819,yc=37820,vc=37821,Mc=36492,bc=36494,Sc=36495,wc=36283,Tc=36284,Ec=36285,Ac=36286;var oi=2300,ai=2301,ua=2302,Cl=2400,Il=2401,Pl=2402,Tf=2500;var th=0,xo=1,rr=2,Ef=3200,Af=3201;var nh=0,Rf=1,Bn="",ct="srgb",Ht="srgb-linear",Cr="linear",st="srgb";var Ji=7680;var Ll=519,Cf=512,If=513,Pf=514,ih=515,Lf=516,Df=517,Nf=518,Uf=519,pa=35044;var sh="300 es",Pn=2e3,Ir=2001;var Gn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}},Xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],cd=1234567,Tr=Math.PI/180,ts=180/Math.PI;function Sn(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Xt[s&255]+Xt[s>>8&255]+Xt[s>>16&255]+Xt[s>>24&255]+"-"+Xt[e&255]+Xt[e>>8&255]+"-"+Xt[e>>16&15|64]+Xt[e>>24&255]+"-"+Xt[t&63|128]+Xt[t>>8&255]+"-"+Xt[t>>16&255]+Xt[t>>24&255]+Xt[n&255]+Xt[n>>8&255]+Xt[n>>16&255]+Xt[n>>24&255]).toLowerCase()}function ze(s,e,t){return Math.max(e,Math.min(t,s))}function rh(s,e){return(s%e+e)%e}function Em(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function Am(s,e,t){return s!==e?(t-s)/(e-s):0}function Er(s,e,t){return(1-t)*s+t*e}function Rm(s,e,t,n){return Er(s,e,1-Math.exp(-t*n))}function Cm(s,e=1){return e-Math.abs(rh(s,e*2)-e)}function Im(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function Pm(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Lm(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Dm(s,e){return s+Math.random()*(e-s)}function Nm(s){return s*(.5-Math.random())}function Um(s){s!==void 0&&(cd=s);let e=cd+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Om(s){return s*Tr}function Fm(s){return s*ts}function Bm(s){return(s&s-1)===0&&s!==0}function km(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function zm(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Hm(s,e,t,n,i){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),h=o((e+n)/2),u=r((e-n)/2),f=o((e-n)/2),d=r((n-e)/2),m=o((n-e)/2);switch(i){case"XYX":s.set(a*h,c*u,c*f,a*l);break;case"YZY":s.set(c*f,a*h,c*u,a*l);break;case"ZXZ":s.set(c*u,c*f,a*h,a*l);break;case"XZX":s.set(a*h,c*m,c*d,a*l);break;case"YXY":s.set(c*d,a*h,c*m,a*l);break;case"ZYZ":s.set(c*m,c*d,a*h,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function In(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function it(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}var nn={DEG2RAD:Tr,RAD2DEG:ts,generateUUID:Sn,clamp:ze,euclideanModulo:rh,mapLinear:Em,inverseLerp:Am,lerp:Er,damp:Rm,pingpong:Cm,smoothstep:Im,smootherstep:Pm,randInt:Lm,randFloat:Dm,randFloatSpread:Nm,seededRandom:Um,degToRad:Om,radToDeg:Fm,isPowerOfTwo:Bm,ceilPowerOfTwo:km,floorPowerOfTwo:zm,setQuaternionFromProperEuler:Hm,normalize:it,denormalize:In},re=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Vt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],h=n[i+2],u=n[i+3],f=r[o+0],d=r[o+1],m=r[o+2],_=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=f,e[t+1]=d,e[t+2]=m,e[t+3]=_;return}if(u!==_||c!==f||l!==d||h!==m){let g=1-a,p=c*f+l*d+h*m+u*_,b=p>=0?1:-1,v=1-p*p;if(v>Number.EPSILON){let S=Math.sqrt(v),T=Math.atan2(S,p*b);g=Math.sin(g*T)/S,a=Math.sin(a*T)/S}let x=a*b;if(c=c*g+f*x,l=l*g+d*x,h=h*g+m*x,u=u*g+_*x,g===1-a){let S=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=S,l*=S,h*=S,u*=S}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,o){let a=n[i],c=n[i+1],l=n[i+2],h=n[i+3],u=r[o],f=r[o+1],d=r[o+2],m=r[o+3];return e[t]=a*m+h*u+c*d-l*f,e[t+1]=c*m+h*f+l*u-a*d,e[t+2]=l*m+h*d+a*f-c*u,e[t+3]=h*m-a*u-c*f-l*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(i/2),u=a(r/2),f=c(n/2),d=c(i/2),m=c(r/2);switch(o){case"XYZ":this._x=f*h*u+l*d*m,this._y=l*d*u-f*h*m,this._z=l*h*m+f*d*u,this._w=l*h*u-f*d*m;break;case"YXZ":this._x=f*h*u+l*d*m,this._y=l*d*u-f*h*m,this._z=l*h*m-f*d*u,this._w=l*h*u+f*d*m;break;case"ZXY":this._x=f*h*u-l*d*m,this._y=l*d*u+f*h*m,this._z=l*h*m+f*d*u,this._w=l*h*u-f*d*m;break;case"ZYX":this._x=f*h*u-l*d*m,this._y=l*d*u+f*h*m,this._z=l*h*m-f*d*u,this._w=l*h*u+f*d*m;break;case"YZX":this._x=f*h*u+l*d*m,this._y=l*d*u+f*h*m,this._z=l*h*m-f*d*u,this._w=l*h*u-f*d*m;break;case"XZY":this._x=f*h*u-l*d*m,this._y=l*d*u-f*h*m,this._z=l*h*m+f*d*u,this._w=l*h*u+f*d*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],h=t[6],u=t[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-c)*d,this._y=(r-l)*d,this._z=(o-i)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-c)/d,this._x=.25*d,this._y=(i+o)/d,this._z=(r+l)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-l)/d,this._x=(i+o)/d,this._y=.25*d,this._z=(c+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-i)/d,this._x=(r+l)/d,this._y=(c+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ze(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+o*a+i*l-r*c,this._y=i*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-i*a,this._w=o*h-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let d=1-t;return this._w=d*o+t*this._w,this._x=d*n+t*this._x,this._y=d*i+t*this._y,this._z=d*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-t)*h)/l,f=Math.sin(t*h)/l;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=i*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},R=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ld.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ld.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*i-a*n),h=2*(a*t-r*i),u=2*(r*n-o*t);return this.x=t+c*l+o*u-a*h,this.y=n+c*h+a*l-r*u,this.z=i+c*u+r*h-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Jc.copy(this).projectOnVector(e),this.sub(Jc)}reflect(e){return this.sub(Jc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Jc=new R,ld=new Vt,Fe=class s{constructor(e,t,n,i,r,o,a,c,l){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,c,l)}set(e,t,n,i,r,o,a,c,l){let h=this.elements;return h[0]=e,h[1]=i,h[2]=a,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],u=n[7],f=n[2],d=n[5],m=n[8],_=i[0],g=i[3],p=i[6],b=i[1],v=i[4],x=i[7],S=i[2],T=i[5],C=i[8];return r[0]=o*_+a*b+c*S,r[3]=o*g+a*v+c*T,r[6]=o*p+a*x+c*C,r[1]=l*_+h*b+u*S,r[4]=l*g+h*v+u*T,r[7]=l*p+h*x+u*C,r[2]=f*_+d*b+m*S,r[5]=f*g+d*v+m*T,r[8]=f*p+d*x+m*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*o*h-t*a*l-n*r*h+n*a*c+i*r*l-i*o*c}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=h*o-a*l,f=a*c-h*r,d=l*r-o*c,m=t*u+n*f+i*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/m;return e[0]=u*_,e[1]=(i*l-h*n)*_,e[2]=(a*n-i*o)*_,e[3]=f*_,e[4]=(h*t-i*c)*_,e[5]=(i*r-a*t)*_,e[6]=d*_,e[7]=(n*c-l*t)*_,e[8]=(o*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Qc.makeScale(e,t)),this}rotate(e){return this.premultiply(Qc.makeRotation(-e)),this}translate(e,t){return this.premultiply(Qc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Qc=new Fe;function oh(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function zs(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Of(){let s=zs("canvas");return s.style.display="block",s}var hd={};function Hs(s){s in hd||(hd[s]=!0,console.warn(s))}function Ff(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var ud=new Fe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),dd=new Fe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Vm(){let s={enabled:!0,workingColorSpace:Ht,spaces:{},convert:function(i,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===st&&(i.r=ri(i.r),i.g=ri(i.g),i.b=ri(i.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===st&&(i.r=Fs(i.r),i.g=Fs(i.g),i.b=Fs(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Bn?Cr:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,o){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return Hs("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return Hs("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Ht]:{primaries:e,whitePoint:n,transfer:Cr,toXYZ:ud,fromXYZ:dd,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:ct},outputColorSpaceConfig:{drawingBufferColorSpace:ct}},[ct]:{primaries:e,whitePoint:n,transfer:st,toXYZ:ud,fromXYZ:dd,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:ct}}}),s}var qe=Vm();function ri(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Fs(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var Ss,Vs=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Ss===void 0&&(Ss=zs("canvas")),Ss.width=e.width,Ss.height=e.height;let i=Ss.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=Ss}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=zs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=ri(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(ri(t[n]/255)*255):t[n]=ri(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Gm=0,Pi=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Gm++}),this.uuid=Sn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(el(i[o].image)):r.push(el(i[o]))}else r=el(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function el(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Vs.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Wm=0,tl=new R,Et=class s extends Gn{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=bn,i=bn,r=zt,o=_n,a=tn,c=Fn,l=s.DEFAULT_ANISOTROPY,h=Bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wm++}),this.uuid=Sn(),this.name="",this.source=new Pi(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new re(0,0),this.repeat=new re(1,1),this.center=new re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(tl).x}get height(){return this.source.getSize(tl).y}get depth(){return this.source.getSize(tl).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ql)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Vn:e.x=e.x-Math.floor(e.x);break;case bn:e.x=e.x<0?0:1;break;case Ii:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Vn:e.y=e.y-Math.floor(e.y);break;case bn:e.y=e.y<0?0:1;break;case Ii:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Et.DEFAULT_IMAGE=null;Et.DEFAULT_MAPPING=ql;Et.DEFAULT_ANISOTROPY=1;var Je=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,c=e.elements,l=c[0],h=c[4],u=c[8],f=c[1],d=c[5],m=c[9],_=c[2],g=c[6],p=c[10];if(Math.abs(h-f)<.01&&Math.abs(u-_)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+_)<.1&&Math.abs(m+g)<.1&&Math.abs(l+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(l+1)/2,x=(d+1)/2,S=(p+1)/2,T=(h+f)/4,C=(u+_)/4,N=(m+g)/4;return v>x&&v>S?v<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(v),i=T/n,r=C/n):x>S?x<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(x),n=T/i,r=N/i):S<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(S),n=C/r,i=N/r),this.set(n,i,r,t),this}let b=Math.sqrt((g-m)*(g-m)+(u-_)*(u-_)+(f-h)*(f-h));return Math.abs(b)<.001&&(b=1),this.x=(g-m)/b,this.y=(u-_)/b,this.z=(f-h)/b,this.w=Math.acos((l+d+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this.w=ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this.w=ze(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ma=class extends Gn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:zt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Je(0,0,e,t),this.scissorTest=!1,this.viewport=new Je(0,0,e,t);let i={width:e,height:t,depth:n.depth},r=new Et(i);this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:zt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Pi(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Wn=class extends ma{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Pr=class extends Et{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=It,this.minFilter=It,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ga=class extends Et{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=It,this.minFilter=It,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Jt=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(An.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(An.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=An.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,An):An.fromBufferAttribute(r,o),An.applyMatrix4(e.matrixWorld),this.expandByPoint(An);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Bo.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Bo.copy(n.boundingBox)),Bo.applyMatrix4(e.matrixWorld),this.union(Bo)}let i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,An),An.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(gr),ko.subVectors(this.max,gr),ws.subVectors(e.a,gr),Ts.subVectors(e.b,gr),Es.subVectors(e.c,gr),bi.subVectors(Ts,ws),Si.subVectors(Es,Ts),$i.subVectors(ws,Es);let t=[0,-bi.z,bi.y,0,-Si.z,Si.y,0,-$i.z,$i.y,bi.z,0,-bi.x,Si.z,0,-Si.x,$i.z,0,-$i.x,-bi.y,bi.x,0,-Si.y,Si.x,0,-$i.y,$i.x,0];return!nl(t,ws,Ts,Es,ko)||(t=[1,0,0,0,1,0,0,0,1],!nl(t,ws,Ts,Es,ko))?!1:(zo.crossVectors(bi,Si),t=[zo.x,zo.y,zo.z],nl(t,ws,Ts,Es,ko))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,An).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(An).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Qn=[new R,new R,new R,new R,new R,new R,new R,new R],An=new R,Bo=new Jt,ws=new R,Ts=new R,Es=new R,bi=new R,Si=new R,$i=new R,gr=new R,ko=new R,zo=new R,Ki=new R;function nl(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){Ki.fromArray(s,r);let a=i.x*Math.abs(Ki.x)+i.y*Math.abs(Ki.y)+i.z*Math.abs(Ki.z),c=e.dot(Ki),l=t.dot(Ki),h=n.dot(Ki);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var Xm=new Jt,_r=new R,il=new R,cn=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Xm.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;_r.subVectors(e,this.center);let t=_r.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(_r,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(il.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(_r.copy(e.center).add(il)),this.expandByPoint(_r.copy(e.center).sub(il))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ei=new R,sl=new R,Ho=new R,wi=new R,rl=new R,Vo=new R,ol=new R,ci=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ei)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ei.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ei.copy(this.origin).addScaledVector(this.direction,t),ei.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){sl.copy(e).add(t).multiplyScalar(.5),Ho.copy(t).sub(e).normalize(),wi.copy(this.origin).sub(sl);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Ho),a=wi.dot(this.direction),c=-wi.dot(Ho),l=wi.lengthSq(),h=Math.abs(1-o*o),u,f,d,m;if(h>0)if(u=o*c-a,f=o*a-c,m=r*h,u>=0)if(f>=-m)if(f<=m){let _=1/h;u*=_,f*=_,d=u*(u+o*f+2*a)+f*(o*u+f+2*c)+l}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;else f<=-m?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-c),r),d=-u*u+f*(f+2*c)+l):f<=m?(u=0,f=Math.min(Math.max(-r,-c),r),d=f*(f+2*c)+l):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-c),r),d=-u*u+f*(f+2*c)+l);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(sl).addScaledVector(Ho,f),d}intersectSphere(e,t){ei.subVectors(e.center,this.origin);let n=ei.dot(this.direction),i=ei.dot(ei)-n*n,r=e.radius*e.radius;if(i>r)return null;let o=Math.sqrt(r-i),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return l>=0?(n=(e.min.x-f.x)*l,i=(e.max.x-f.x)*l):(n=(e.max.x-f.x)*l,i=(e.min.x-f.x)*l),h>=0?(r=(e.min.y-f.y)*h,o=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,o=(e.min.y-f.y)*h),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),u>=0?(a=(e.min.z-f.z)*u,c=(e.max.z-f.z)*u):(a=(e.max.z-f.z)*u,c=(e.min.z-f.z)*u),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,ei)!==null}intersectTriangle(e,t,n,i,r){rl.subVectors(t,e),Vo.subVectors(n,e),ol.crossVectors(rl,Vo);let o=this.direction.dot(ol),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;wi.subVectors(this.origin,e);let c=a*this.direction.dot(Vo.crossVectors(wi,Vo));if(c<0)return null;let l=a*this.direction.dot(rl.cross(wi));if(l<0||c+l>o)return null;let h=-a*wi.dot(ol);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ce=class s{constructor(e,t,n,i,r,o,a,c,l,h,u,f,d,m,_,g){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,c,l,h,u,f,d,m,_,g)}set(e,t,n,i,r,o,a,c,l,h,u,f,d,m,_,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=m,p[11]=_,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/As.setFromMatrixColumn(e,0).length(),r=1/As.setFromMatrixColumn(e,1).length(),o=1/As.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=o*h,d=o*u,m=a*h,_=a*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=d+m*l,t[5]=f-_*l,t[9]=-a*c,t[2]=_-f*l,t[6]=m+d*l,t[10]=o*c}else if(e.order==="YXZ"){let f=c*h,d=c*u,m=l*h,_=l*u;t[0]=f+_*a,t[4]=m*a-d,t[8]=o*l,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=d*a-m,t[6]=_+f*a,t[10]=o*c}else if(e.order==="ZXY"){let f=c*h,d=c*u,m=l*h,_=l*u;t[0]=f-_*a,t[4]=-o*u,t[8]=m+d*a,t[1]=d+m*a,t[5]=o*h,t[9]=_-f*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let f=o*h,d=o*u,m=a*h,_=a*u;t[0]=c*h,t[4]=m*l-d,t[8]=f*l+_,t[1]=c*u,t[5]=_*l+f,t[9]=d*l-m,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let f=o*c,d=o*l,m=a*c,_=a*l;t[0]=c*h,t[4]=_-f*u,t[8]=m*u+d,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-l*h,t[6]=d*u+m,t[10]=f-_*u}else if(e.order==="XZY"){let f=o*c,d=o*l,m=a*c,_=a*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=f*u+_,t[5]=o*h,t[9]=d*u-m,t[2]=m*u-d,t[6]=a*h,t[10]=_*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ym,e,qm)}lookAt(e,t,n){let i=this.elements;return pn.subVectors(e,t),pn.lengthSq()===0&&(pn.z=1),pn.normalize(),Ti.crossVectors(n,pn),Ti.lengthSq()===0&&(Math.abs(n.z)===1?pn.x+=1e-4:pn.z+=1e-4,pn.normalize(),Ti.crossVectors(n,pn)),Ti.normalize(),Go.crossVectors(pn,Ti),i[0]=Ti.x,i[4]=Go.x,i[8]=pn.x,i[1]=Ti.y,i[5]=Go.y,i[9]=pn.y,i[2]=Ti.z,i[6]=Go.z,i[10]=pn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],u=n[5],f=n[9],d=n[13],m=n[2],_=n[6],g=n[10],p=n[14],b=n[3],v=n[7],x=n[11],S=n[15],T=i[0],C=i[4],N=i[8],E=i[12],w=i[1],P=i[5],k=i[9],z=i[13],X=i[2],G=i[6],Y=i[10],J=i[14],H=i[3],ae=i[7],ue=i[11],Te=i[15];return r[0]=o*T+a*w+c*X+l*H,r[4]=o*C+a*P+c*G+l*ae,r[8]=o*N+a*k+c*Y+l*ue,r[12]=o*E+a*z+c*J+l*Te,r[1]=h*T+u*w+f*X+d*H,r[5]=h*C+u*P+f*G+d*ae,r[9]=h*N+u*k+f*Y+d*ue,r[13]=h*E+u*z+f*J+d*Te,r[2]=m*T+_*w+g*X+p*H,r[6]=m*C+_*P+g*G+p*ae,r[10]=m*N+_*k+g*Y+p*ue,r[14]=m*E+_*z+g*J+p*Te,r[3]=b*T+v*w+x*X+S*H,r[7]=b*C+v*P+x*G+S*ae,r[11]=b*N+v*k+x*Y+S*ue,r[15]=b*E+v*z+x*J+S*Te,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],h=e[2],u=e[6],f=e[10],d=e[14],m=e[3],_=e[7],g=e[11],p=e[15];return m*(+r*c*u-i*l*u-r*a*f+n*l*f+i*a*d-n*c*d)+_*(+t*c*d-t*l*f+r*o*f-i*o*d+i*l*h-r*c*h)+g*(+t*l*u-t*a*d-r*o*u+n*o*d+r*a*h-n*l*h)+p*(-i*a*h-t*c*u+t*a*f+i*o*u-n*o*f+n*c*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=e[9],f=e[10],d=e[11],m=e[12],_=e[13],g=e[14],p=e[15],b=u*g*l-_*f*l+_*c*d-a*g*d-u*c*p+a*f*p,v=m*f*l-h*g*l-m*c*d+o*g*d+h*c*p-o*f*p,x=h*_*l-m*u*l+m*a*d-o*_*d-h*a*p+o*u*p,S=m*u*c-h*_*c-m*a*f+o*_*f+h*a*g-o*u*g,T=t*b+n*v+i*x+r*S;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/T;return e[0]=b*C,e[1]=(_*f*r-u*g*r-_*i*d+n*g*d+u*i*p-n*f*p)*C,e[2]=(a*g*r-_*c*r+_*i*l-n*g*l-a*i*p+n*c*p)*C,e[3]=(u*c*r-a*f*r-u*i*l+n*f*l+a*i*d-n*c*d)*C,e[4]=v*C,e[5]=(h*g*r-m*f*r+m*i*d-t*g*d-h*i*p+t*f*p)*C,e[6]=(m*c*r-o*g*r-m*i*l+t*g*l+o*i*p-t*c*p)*C,e[7]=(o*f*r-h*c*r+h*i*l-t*f*l-o*i*d+t*c*d)*C,e[8]=x*C,e[9]=(m*u*r-h*_*r-m*n*d+t*_*d+h*n*p-t*u*p)*C,e[10]=(o*_*r-m*a*r+m*n*l-t*_*l-o*n*p+t*a*p)*C,e[11]=(h*a*r-o*u*r-h*n*l+t*u*l+o*n*d-t*a*d)*C,e[12]=S*C,e[13]=(h*_*i-m*u*i+m*n*f-t*_*f-h*n*g+t*u*g)*C,e[14]=(m*a*i-o*_*i-m*n*c+t*_*c+o*n*g-t*a*g)*C,e[15]=(o*u*i-h*a*i+h*n*c-t*u*c-o*n*f+t*a*f)*C,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,h*a+n,h*c-i*o,0,l*c-i*a,h*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,h=o+o,u=a+a,f=r*l,d=r*h,m=r*u,_=o*h,g=o*u,p=a*u,b=c*l,v=c*h,x=c*u,S=n.x,T=n.y,C=n.z;return i[0]=(1-(_+p))*S,i[1]=(d+x)*S,i[2]=(m-v)*S,i[3]=0,i[4]=(d-x)*T,i[5]=(1-(f+p))*T,i[6]=(g+b)*T,i[7]=0,i[8]=(m+v)*C,i[9]=(g-b)*C,i[10]=(1-(f+_))*C,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=As.set(i[0],i[1],i[2]).length(),o=As.set(i[4],i[5],i[6]).length(),a=As.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Rn.copy(this);let l=1/r,h=1/o,u=1/a;return Rn.elements[0]*=l,Rn.elements[1]*=l,Rn.elements[2]*=l,Rn.elements[4]*=h,Rn.elements[5]*=h,Rn.elements[6]*=h,Rn.elements[8]*=u,Rn.elements[9]*=u,Rn.elements[10]*=u,t.setFromRotationMatrix(Rn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o,a=Pn,c=!1){let l=this.elements,h=2*r/(t-e),u=2*r/(n-i),f=(t+e)/(t-e),d=(n+i)/(n-i),m,_;if(c)m=r/(o-r),_=o*r/(o-r);else if(a===Pn)m=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===Ir)m=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,r,o,a=Pn,c=!1){let l=this.elements,h=2/(t-e),u=2/(n-i),f=-(t+e)/(t-e),d=-(n+i)/(n-i),m,_;if(c)m=1/(o-r),_=o/(o-r);else if(a===Pn)m=-2/(o-r),_=-(o+r)/(o-r);else if(a===Ir)m=-1/(o-r),_=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=f,l[1]=0,l[5]=u,l[9]=0,l[13]=d,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},As=new R,Rn=new Ce,Ym=new R(0,0,0),qm=new R(1,1,1),Ti=new R,Go=new R,pn=new R,fd=new Ce,pd=new Vt,Dn=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],h=i[9],u=i[2],f=i[6],d=i[10];switch(t){case"XYZ":this._y=Math.asin(ze(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ze(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ze(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-ze(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ze(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return fd.makeRotationFromQuaternion(e),this.setFromRotationMatrix(fd,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return pd.setFromEuler(this),this.setFromQuaternion(pd,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Dn.DEFAULT_ORDER="XYZ";var Lr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},$m=0,md=new R,Rs=new Vt,ti=new Ce,Wo=new R,xr=new R,Km=new R,jm=new Vt,gd=new R(1,0,0),_d=new R(0,1,0),xd=new R(0,0,1),yd={type:"added"},Zm={type:"removed"},Cs={type:"childadded",child:null},al={type:"childremoved",child:null},ut=class s extends Gn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:$m++}),this.uuid=Sn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new R,t=new Dn,n=new Vt,i=new R(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ce},normalMatrix:{value:new Fe}}),this.matrix=new Ce,this.matrixWorld=new Ce,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Lr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Rs.setFromAxisAngle(e,t),this.quaternion.multiply(Rs),this}rotateOnWorldAxis(e,t){return Rs.setFromAxisAngle(e,t),this.quaternion.premultiply(Rs),this}rotateX(e){return this.rotateOnAxis(gd,e)}rotateY(e){return this.rotateOnAxis(_d,e)}rotateZ(e){return this.rotateOnAxis(xd,e)}translateOnAxis(e,t){return md.copy(e).applyQuaternion(this.quaternion),this.position.add(md.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(gd,e)}translateY(e){return this.translateOnAxis(_d,e)}translateZ(e){return this.translateOnAxis(xd,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ti.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Wo.copy(e):Wo.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),xr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ti.lookAt(xr,Wo,this.up):ti.lookAt(Wo,xr,this.up),this.quaternion.setFromRotationMatrix(ti),i&&(ti.extractRotation(i.matrixWorld),Rs.setFromRotationMatrix(ti),this.quaternion.premultiply(Rs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yd),Cs.child=e,this.dispatchEvent(Cs),Cs.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Zm),al.child=e,this.dispatchEvent(al),al.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ti.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ti.multiply(e.parent.matrixWorld)),e.applyMatrix4(ti),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yd),Cs.child=e,this.dispatchEvent(Cs),Cs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xr,e,Km),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xr,jm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(a=>({...a})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),h=o(e.images),u=o(e.shapes),f=o(e.skeletons),d=o(e.animations),m=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};ut.DEFAULT_UP=new R(0,1,0);ut.DEFAULT_MATRIX_AUTO_UPDATE=!0;ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Cn=new R,ni=new R,cl=new R,ii=new R,Is=new R,Ps=new R,vd=new R,ll=new R,hl=new R,ul=new R,dl=new Je,fl=new Je,pl=new Je,Ri=class s{constructor(e=new R,t=new R,n=new R){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Cn.subVectors(e,t),i.cross(Cn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Cn.subVectors(i,t),ni.subVectors(n,t),cl.subVectors(e,t);let o=Cn.dot(Cn),a=Cn.dot(ni),c=Cn.dot(cl),l=ni.dot(ni),h=ni.dot(cl),u=o*l-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(l*c-a*h)*f,m=(o*h-a*c)*f;return r.set(1-d-m,m,d)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,ii)===null?!1:ii.x>=0&&ii.y>=0&&ii.x+ii.y<=1}static getInterpolation(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,ii)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,ii.x),c.addScaledVector(o,ii.y),c.addScaledVector(a,ii.z),c)}static getInterpolatedAttribute(e,t,n,i,r,o){return dl.setScalar(0),fl.setScalar(0),pl.setScalar(0),dl.fromBufferAttribute(e,t),fl.fromBufferAttribute(e,n),pl.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(dl,r.x),o.addScaledVector(fl,r.y),o.addScaledVector(pl,r.z),o}static isFrontFacing(e,t,n,i){return Cn.subVectors(n,t),ni.subVectors(e,t),Cn.cross(ni).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Cn.subVectors(this.c,this.b),ni.subVectors(this.a,this.b),Cn.cross(ni).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,o,a;Is.subVectors(i,n),Ps.subVectors(r,n),ll.subVectors(e,n);let c=Is.dot(ll),l=Ps.dot(ll);if(c<=0&&l<=0)return t.copy(n);hl.subVectors(e,i);let h=Is.dot(hl),u=Ps.dot(hl);if(h>=0&&u<=h)return t.copy(i);let f=c*u-h*l;if(f<=0&&c>=0&&h<=0)return o=c/(c-h),t.copy(n).addScaledVector(Is,o);ul.subVectors(e,r);let d=Is.dot(ul),m=Ps.dot(ul);if(m>=0&&d<=m)return t.copy(r);let _=d*l-c*m;if(_<=0&&l>=0&&m<=0)return a=l/(l-m),t.copy(n).addScaledVector(Ps,a);let g=h*m-d*u;if(g<=0&&u-h>=0&&d-m>=0)return vd.subVectors(r,i),a=(u-h)/(u-h+(d-m)),t.copy(i).addScaledVector(vd,a);let p=1/(g+_+f);return o=_*p,a=f*p,t.copy(n).addScaledVector(Is,o).addScaledVector(Ps,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Bf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ei={h:0,s:0,l:0},Xo={h:0,s:0,l:0};function ml(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var we=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ct){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,qe.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=qe.workingColorSpace){if(e=rh(e,1),t=ze(t,0,1),n=ze(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=ml(o,r,e+1/3),this.g=ml(o,r,e),this.b=ml(o,r,e-1/3)}return qe.colorSpaceToWorking(this,i),this}setStyle(e,t=ct){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ct){let n=Bf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ri(e.r),this.g=ri(e.g),this.b=ri(e.b),this}copyLinearToSRGB(e){return this.r=Fs(e.r),this.g=Fs(e.g),this.b=Fs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ct){return qe.workingToColorSpace(Yt.copy(this),e),Math.round(ze(Yt.r*255,0,255))*65536+Math.round(ze(Yt.g*255,0,255))*256+Math.round(ze(Yt.b*255,0,255))}getHexString(e=ct){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.workingToColorSpace(Yt.copy(this),t);let n=Yt.r,i=Yt.g,r=Yt.b,o=Math.max(n,i,r),a=Math.min(n,i,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case n:c=(i-r)/u+(i<r?6:0);break;case i:c=(r-n)/u+2;break;case r:c=(n-i)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.workingToColorSpace(Yt.copy(this),t),e.r=Yt.r,e.g=Yt.g,e.b=Yt.b,e}getStyle(e=ct){qe.workingToColorSpace(Yt.copy(this),e);let t=Yt.r,n=Yt.g,i=Yt.b;return e!==ct?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ei),this.setHSL(Ei.h+e,Ei.s+t,Ei.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ei),e.getHSL(Xo);let n=Er(Ei.h,Xo.h,t),i=Er(Ei.s,Xo.s,t),r=Er(Ei.l,Xo.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Yt=new we;we.NAMES=Bf;var Jm=0,ln=class extends Gn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Jm++}),this.uuid=Sn(),this.name="",this.type="Material",this.blending=Qi,this.side=Ln,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=da,this.blendDst=fa,this.blendEquation=Ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new we(0,0,0),this.blendAlpha=0,this.depthFunc=es,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ll,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ji,this.stencilZFail=Ji,this.stencilZPass=Ji,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Qi&&(n.blending=this.blending),this.side!==Ln&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==da&&(n.blendSrc=this.blendSrc),this.blendDst!==fa&&(n.blendDst=this.blendDst),this.blendEquation!==Ci&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==es&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ll&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ji&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ji&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ji&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Nn=class extends ln{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new we(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.combine=Yl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var wt=new R,Yo=new re,Qm=0,Ke=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Qm++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=pa,this.updateRanges=[],this.gpuType=wn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Yo.fromBufferAttribute(this,t),Yo.applyMatrix3(e),this.setXY(t,Yo.x,Yo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=In(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=it(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=In(t,this.array)),t}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=In(t,this.array)),t}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=In(t,this.array)),t}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=In(t,this.array)),t}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array),r=it(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==pa&&(e.usage=this.usage),e}};var Dr=class extends Ke{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Nr=class extends Ke{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Ct=class extends Ke{constructor(e,t,n){super(new Float32Array(e),t,n)}},eg=0,Mn=new Ce,gl=new ut,Ls=new R,mn=new Jt,yr=new Jt,Ft=new R,Pt=class s extends Gn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:eg++}),this.uuid=Sn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(oh(e)?Nr:Dr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Fe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Mn.makeRotationFromQuaternion(e),this.applyMatrix4(Mn),this}rotateX(e){return Mn.makeRotationX(e),this.applyMatrix4(Mn),this}rotateY(e){return Mn.makeRotationY(e),this.applyMatrix4(Mn),this}rotateZ(e){return Mn.makeRotationZ(e),this.applyMatrix4(Mn),this}translate(e,t,n){return Mn.makeTranslation(e,t,n),this.applyMatrix4(Mn),this}scale(e,t,n){return Mn.makeScale(e,t,n),this.applyMatrix4(Mn),this}lookAt(e){return gl.lookAt(e),gl.updateMatrix(),this.applyMatrix4(gl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ls).negate(),this.translate(Ls.x,Ls.y,Ls.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let o=e[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Ct(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Jt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];mn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ft.addVectors(this.boundingBox.min,mn.min),this.boundingBox.expandByPoint(Ft),Ft.addVectors(this.boundingBox.max,mn.max),this.boundingBox.expandByPoint(Ft)):(this.boundingBox.expandByPoint(mn.min),this.boundingBox.expandByPoint(mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new cn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let n=this.boundingSphere.center;if(mn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];yr.setFromBufferAttribute(a),this.morphTargetsRelative?(Ft.addVectors(mn.min,yr.min),mn.expandByPoint(Ft),Ft.addVectors(mn.max,yr.max),mn.expandByPoint(Ft)):(mn.expandByPoint(yr.min),mn.expandByPoint(yr.max))}mn.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)Ft.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Ft));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)Ft.fromBufferAttribute(a,l),c&&(Ls.fromBufferAttribute(e,l),Ft.add(Ls)),i=Math.max(i,n.distanceToSquared(Ft))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ke(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let N=0;N<n.count;N++)a[N]=new R,c[N]=new R;let l=new R,h=new R,u=new R,f=new re,d=new re,m=new re,_=new R,g=new R;function p(N,E,w){l.fromBufferAttribute(n,N),h.fromBufferAttribute(n,E),u.fromBufferAttribute(n,w),f.fromBufferAttribute(r,N),d.fromBufferAttribute(r,E),m.fromBufferAttribute(r,w),h.sub(l),u.sub(l),d.sub(f),m.sub(f);let P=1/(d.x*m.y-m.x*d.y);isFinite(P)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(u,-d.y).multiplyScalar(P),g.copy(u).multiplyScalar(d.x).addScaledVector(h,-m.x).multiplyScalar(P),a[N].add(_),a[E].add(_),a[w].add(_),c[N].add(g),c[E].add(g),c[w].add(g))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let N=0,E=b.length;N<E;++N){let w=b[N],P=w.start,k=w.count;for(let z=P,X=P+k;z<X;z+=3)p(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let v=new R,x=new R,S=new R,T=new R;function C(N){S.fromBufferAttribute(i,N),T.copy(S);let E=a[N];v.copy(E),v.sub(S.multiplyScalar(S.dot(E))).normalize(),x.crossVectors(T,E);let P=x.dot(c[N])<0?-1:1;o.setXYZW(N,v.x,v.y,v.z,P)}for(let N=0,E=b.length;N<E;++N){let w=b[N],P=w.start,k=w.count;for(let z=P,X=P+k;z<X;z+=3)C(e.getX(z+0)),C(e.getX(z+1)),C(e.getX(z+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ke(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let i=new R,r=new R,o=new R,a=new R,c=new R,l=new R,h=new R,u=new R;if(e)for(let f=0,d=e.count;f<d;f+=3){let m=e.getX(f+0),_=e.getX(f+1),g=e.getX(f+2);i.fromBufferAttribute(t,m),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,g),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),a.fromBufferAttribute(n,m),c.fromBufferAttribute(n,_),l.fromBufferAttribute(n,g),a.add(h),c.add(h),l.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(_,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let f=0,d=t.count;f<d;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ft.fromBufferAttribute(e,t),Ft.normalize(),e.setXYZ(t,Ft.x,Ft.y,Ft.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,u=a.normalized,f=new l.constructor(c.length*h),d=0,m=0;for(let _=0,g=c.length;_<g;_++){a.isInterleavedBufferAttribute?d=c[_]*a.data.stride+a.offset:d=c[_]*h;for(let p=0;p<h;p++)f[m++]=l[d++]}return new Ke(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let a in i){let c=i[a],l=e(c,n);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,u=l.length;h<u;h++){let f=l[h],d=e(f,n);c.push(d)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let i={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,f=l.length;u<f;u++){let d=l[u];h.push(d.toJSON(e.data))}h.length>0&&(i[c]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let l in i){let h=i[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],u=r[l];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Md=new Ce,ji=new ci,qo=new cn,bd=new R,$o=new R,Ko=new R,jo=new R,_l=new R,Zo=new R,Sd=new R,Jo=new R,pt=class extends ut{constructor(e=new Pt,t=new Nn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let a=this.morphTargetInfluences;if(r&&a){Zo.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],u=r[c];h!==0&&(_l.fromBufferAttribute(u,e),o?Zo.addScaledVector(_l,h):Zo.addScaledVector(_l.sub(t),h))}t.add(Zo)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),qo.copy(n.boundingSphere),qo.applyMatrix4(r),ji.copy(e.ray).recast(e.near),!(qo.containsPoint(ji.origin)===!1&&(ji.intersectSphere(qo,bd)===null||ji.origin.distanceToSquared(bd)>(e.far-e.near)**2))&&(Md.copy(r).invert(),ji.copy(e.ray).applyMatrix4(Md),!(n.boundingBox!==null&&ji.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ji)))}_computeIntersections(e,t,n){let i,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,_=f.length;m<_;m++){let g=f[m],p=o[g.materialIndex],b=Math.max(g.start,d.start),v=Math.min(a.count,Math.min(g.start+g.count,d.start+d.count));for(let x=b,S=v;x<S;x+=3){let T=a.getX(x),C=a.getX(x+1),N=a.getX(x+2);i=Qo(this,p,e,n,l,h,u,T,C,N),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=g.materialIndex,t.push(i))}}else{let m=Math.max(0,d.start),_=Math.min(a.count,d.start+d.count);for(let g=m,p=_;g<p;g+=3){let b=a.getX(g),v=a.getX(g+1),x=a.getX(g+2);i=Qo(this,o,e,n,l,h,u,b,v,x),i&&(i.faceIndex=Math.floor(g/3),t.push(i))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,_=f.length;m<_;m++){let g=f[m],p=o[g.materialIndex],b=Math.max(g.start,d.start),v=Math.min(c.count,Math.min(g.start+g.count,d.start+d.count));for(let x=b,S=v;x<S;x+=3){let T=x,C=x+1,N=x+2;i=Qo(this,p,e,n,l,h,u,T,C,N),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=g.materialIndex,t.push(i))}}else{let m=Math.max(0,d.start),_=Math.min(c.count,d.start+d.count);for(let g=m,p=_;g<p;g+=3){let b=g,v=g+1,x=g+2;i=Qo(this,o,e,n,l,h,u,b,v,x),i&&(i.faceIndex=Math.floor(g/3),t.push(i))}}}};function tg(s,e,t,n,i,r,o,a){let c;if(e.side===en?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===Ln,a),c===null)return null;Jo.copy(a),Jo.applyMatrix4(s.matrixWorld);let l=t.ray.origin.distanceTo(Jo);return l<t.near||l>t.far?null:{distance:l,point:Jo.clone(),object:s}}function Qo(s,e,t,n,i,r,o,a,c,l){s.getVertexPosition(a,$o),s.getVertexPosition(c,Ko),s.getVertexPosition(l,jo);let h=tg(s,e,t,n,$o,Ko,jo,Sd);if(h){let u=new R;Ri.getBarycoord(Sd,$o,Ko,jo,u),i&&(h.uv=Ri.getInterpolatedAttribute(i,a,c,l,u,new re)),r&&(h.uv1=Ri.getInterpolatedAttribute(r,a,c,l,u,new re)),o&&(h.normal=Ri.getInterpolatedAttribute(o,a,c,l,u,new R),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:c,c:l,normal:new R,materialIndex:0};Ri.getNormal($o,Ko,jo,f.normal),h.face=f,h.barycoord=u}return h}var li=class s extends Pt{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};let a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],u=[],f=0,d=0;m("z","y","x",-1,-1,n,t,e,o,r,0),m("z","y","x",1,-1,n,t,-e,o,r,1),m("x","z","y",1,1,e,n,t,i,o,2),m("x","z","y",1,-1,e,n,-t,i,o,3),m("x","y","z",1,-1,e,t,n,i,r,4),m("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new Ct(l,3)),this.setAttribute("normal",new Ct(h,3)),this.setAttribute("uv",new Ct(u,2));function m(_,g,p,b,v,x,S,T,C,N,E){let w=x/C,P=S/N,k=x/2,z=S/2,X=T/2,G=C+1,Y=N+1,J=0,H=0,ae=new R;for(let ue=0;ue<Y;ue++){let Te=ue*P-z;for(let Ge=0;Ge<G;Ge++){let lt=Ge*w-k;ae[_]=lt*b,ae[g]=Te*v,ae[p]=X,l.push(ae.x,ae.y,ae.z),ae[_]=0,ae[g]=0,ae[p]=T>0?1:-1,h.push(ae.x,ae.y,ae.z),u.push(Ge/C),u.push(1-ue/N),J+=1}}for(let ue=0;ue<N;ue++)for(let Te=0;Te<C;Te++){let Ge=f+Te+G*ue,lt=f+Te+G*(ue+1),mt=f+(Te+1)+G*(ue+1),et=f+(Te+1)+G*ue;c.push(Ge,lt,et),c.push(lt,mt,et),H+=6}a.addGroup(d,H,E),d+=H,f+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function hs(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function $t(s){let e={};for(let t=0;t<s.length;t++){let n=hs(s[t]);for(let i in n)e[i]=n[i]}return e}function ng(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function ah(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}var kf={clone:hs,merge:$t},ig=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,sg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Un=class extends ln{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ig,this.fragmentShader=sg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=hs(e.uniforms),this.uniformsGroups=ng(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Ur=class extends ut{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ce,this.projectionMatrix=new Ce,this.projectionMatrixInverse=new Ce,this.coordinateSystem=Pn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ai=new R,wd=new re,Td=new re,Tt=class extends Ur{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ts*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Tr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ts*2*Math.atan(Math.tan(Tr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ai.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ai.x,Ai.y).multiplyScalar(-e/Ai.z),Ai.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ai.x,Ai.y).multiplyScalar(-e/Ai.z)}getViewSize(e,t){return this.getViewBounds(e,wd,Td),t.subVectors(Td,wd)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Tr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ds=-90,Ns=1,_a=class extends ut{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Tt(Ds,Ns,e,t);i.layers=this.layers,this.add(i);let r=new Tt(Ds,Ns,e,t);r.layers=this.layers,this.add(r);let o=new Tt(Ds,Ns,e,t);o.layers=this.layers,this.add(o);let a=new Tt(Ds,Ns,e,t);a.layers=this.layers,this.add(a);let c=new Tt(Ds,Ns,e,t);c.layers=this.layers,this.add(c);let l=new Tt(Ds,Ns,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===Pn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Ir)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,o),e.setRenderTarget(n,2,i),e.render(t,a),e.setRenderTarget(n,3,i),e.render(t,c),e.setRenderTarget(n,4,i),e.render(t,l),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},Or=class extends Et{constructor(e=[],t=cs,n,i,r,o,a,c,l,h){super(e,t,n,i,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},xa=class extends Wn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Or(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new li(5,5,5),r=new Un({name:"CubemapFromEquirect",uniforms:hs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:en,blending:mi});r.uniforms.tEquirect.value=t;let o=new pt(i,r),a=t.minFilter;return t.minFilter===_n&&(t.minFilter=zt),new _a(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}},Rt=class extends ut{constructor(){super(),this.isGroup=!0,this.type="Group"}},rg={type:"move"},Gs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Rt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Rt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Rt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let _ of e.hand.values()){let g=t.getJointPose(_,n),p=this._getHandJoint(l,_);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,m=.005;l.inputState.pinching&&f>d+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=d-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(rg)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Rt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var On=class extends ut{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Dn,this.environmentIntensity=1,this.environmentRotation=new Dn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ws=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=pa,this.updateRanges=[],this.version=0,this.uuid=Sn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Sn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Sn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Zt=new R,Xs=class s{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.applyMatrix4(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.applyNormalMatrix(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.transformDirection(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=In(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=it(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=In(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=In(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=In(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=In(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array),r=it(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Ke(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new s(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var Ed=new R,Ad=new Je,Rd=new Je,og=new R,Cd=new Ce,ea=new R,xl=new cn,Id=new Ce,yl=new ci,Fr=class extends pt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Rl,this.bindMatrix=new Ce,this.bindMatrixInverse=new Ce,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Jt),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ea),this.boundingBox.expandByPoint(ea)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new cn),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ea),this.boundingSphere.expandByPoint(ea)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),xl.copy(this.boundingSphere),xl.applyMatrix4(i),e.ray.intersectsSphere(xl)!==!1&&(Id.copy(i).invert(),yl.copy(e.ray).applyMatrix4(Id),!(this.boundingBox!==null&&yl.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,yl)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Je,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Rl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===wf?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;Ad.fromBufferAttribute(i.attributes.skinIndex,e),Rd.fromBufferAttribute(i.attributes.skinWeight,e),Ed.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=Rd.getComponent(r);if(o!==0){let a=Ad.getComponent(r);Cd.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(og.copy(Ed).applyMatrix4(Cd),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},Ys=class extends ut{constructor(){super(),this.isBone=!0,this.type="Bone"}},Br=class extends Et{constructor(e=null,t=1,n=1,i,r,o,a,c,l=It,h=It,u,f){super(null,o,a,c,l,h,i,r,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Pd=new Ce,ag=new Ce,kr=class s{constructor(e=[],t=[]){this.uuid=Sn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Ce)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new Ce;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:ag;Pd.multiplyMatrices(a,t[r]),Pd.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new s(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new Br(t,e,e,tn,wn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new Ys),this.bones.push(o),this.boneInverses.push(new Ce().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let o=t[i];e.bones.push(o.uuid);let a=n[i];e.boneInverses.push(a.toArray())}return e}},Li=class extends Ke{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Us=new Ce,Ld=new Ce,ta=[],Dd=new Jt,cg=new Ce,vr=new pt,Mr=new cn,zr=class extends pt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Li(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,cg)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Jt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Us),Dd.copy(e.boundingBox).applyMatrix4(Us),this.boundingBox.union(Dd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new cn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Us),Mr.copy(e.boundingSphere).applyMatrix4(Us),this.boundingSphere.union(Mr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(vr.geometry=this.geometry,vr.material=this.material,vr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Mr.copy(this.boundingSphere),Mr.applyMatrix4(n),e.ray.intersectsSphere(Mr)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Us),Ld.multiplyMatrices(n,Us),vr.matrixWorld=Ld,vr.raycast(e,ta);for(let o=0,a=ta.length;o<a;o++){let c=ta[o];c.instanceId=r,c.object=this,t.push(c)}ta.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Li(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Br(new Float32Array(i*this.count),i,this.count,ja,wn));let r=this.morphTexture.source.data.data,o=0;for(let l=0;l<n.length;l++)o+=n[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=i*e;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},vl=new R,lg=new R,hg=new Fe,an=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=vl.subVectors(n,t).cross(lg.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(vl),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||hg.getNormalMatrix(e),i=this.coplanarPoint(vl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Zi=new cn,ug=new re(.5,.5),na=new R,qs=class{constructor(e=new an,t=new an,n=new an,i=new an,r=new an,o=new an){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Pn,n=!1){let i=this.planes,r=e.elements,o=r[0],a=r[1],c=r[2],l=r[3],h=r[4],u=r[5],f=r[6],d=r[7],m=r[8],_=r[9],g=r[10],p=r[11],b=r[12],v=r[13],x=r[14],S=r[15];if(i[0].setComponents(l-o,d-h,p-m,S-b).normalize(),i[1].setComponents(l+o,d+h,p+m,S+b).normalize(),i[2].setComponents(l+a,d+u,p+_,S+v).normalize(),i[3].setComponents(l-a,d-u,p-_,S-v).normalize(),n)i[4].setComponents(c,f,g,x).normalize(),i[5].setComponents(l-c,d-f,p-g,S-x).normalize();else if(i[4].setComponents(l-c,d-f,p-g,S-x).normalize(),t===Pn)i[5].setComponents(l+c,d+f,p+g,S+x).normalize();else if(t===Ir)i[5].setComponents(c,f,g,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Zi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Zi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Zi)}intersectsSprite(e){Zi.center.set(0,0,0);let t=ug.distanceTo(e.center);return Zi.radius=.7071067811865476+t,Zi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Zi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(na.x=i.normal.x>0?e.max.x:e.min.x,na.y=i.normal.y>0?e.max.y:e.min.y,na.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(na)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var $s=class extends ln{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new we(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ya=new R,va=new R,Nd=new Ce,br=new ci,ia=new cn,Ml=new R,Ud=new R,ns=class extends ut{constructor(e=new Pt,t=new $s){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)ya.fromBufferAttribute(t,i-1),va.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=ya.distanceTo(va);e.setAttribute("lineDistance",new Ct(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ia.copy(n.boundingSphere),ia.applyMatrix4(i),ia.radius+=r,e.ray.intersectsSphere(ia)===!1)return;Nd.copy(i).invert(),br.copy(e.ray).applyMatrix4(Nd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let d=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let _=d,g=m-1;_<g;_+=l){let p=h.getX(_),b=h.getX(_+1),v=sa(this,e,br,c,p,b,_);v&&t.push(v)}if(this.isLineLoop){let _=h.getX(m-1),g=h.getX(d),p=sa(this,e,br,c,_,g,m-1);p&&t.push(p)}}else{let d=Math.max(0,o.start),m=Math.min(f.count,o.start+o.count);for(let _=d,g=m-1;_<g;_+=l){let p=sa(this,e,br,c,_,_+1,_);p&&t.push(p)}if(this.isLineLoop){let _=sa(this,e,br,c,m-1,d,m-1);_&&t.push(_)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function sa(s,e,t,n,i,r,o){let a=s.geometry.attributes.position;if(ya.fromBufferAttribute(a,i),va.fromBufferAttribute(a,r),t.distanceSqToSegment(ya,va,Ml,Ud)>n)return;Ml.applyMatrix4(s.matrixWorld);let l=e.ray.origin.distanceTo(Ml);if(!(l<e.near||l>e.far))return{distance:l,point:Ud.clone().applyMatrix4(s.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:s}}var Od=new R,Fd=new R,Hr=class extends ns{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)Od.fromBufferAttribute(t,i),Fd.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Od.distanceTo(Fd);e.setAttribute("lineDistance",new Ct(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Vr=class extends ns{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},Di=class extends ln{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new we(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Bd=new Ce,Dl=new ci,ra=new cn,oa=new R,is=class extends ut{constructor(e=new Pt,t=new Di){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ra.copy(n.boundingSphere),ra.applyMatrix4(i),ra.radius+=r,e.ray.intersectsSphere(ra)===!1)return;Bd.copy(i).invert(),Dl.copy(e.ray).applyMatrix4(Bd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,u=n.attributes.position;if(l!==null){let f=Math.max(0,o.start),d=Math.min(l.count,o.start+o.count);for(let m=f,_=d;m<_;m++){let g=l.getX(m);oa.fromBufferAttribute(u,g),kd(oa,g,c,i,e,t,this)}}else{let f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let m=f,_=d;m<_;m++)oa.fromBufferAttribute(u,m),kd(oa,m,c,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function kd(s,e,t,n,i,r,o){let a=Dl.distanceSqToPoint(s);if(a<t){let c=new R;Dl.closestPointToPoint(s,c),c.applyMatrix4(n);let l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var ss=class extends Et{constructor(e,t,n,i,r,o,a,c,l,h,u,f){super(null,o,a,c,l,h,i,r,u,f),this.isCompressedTexture=!0,this.image={width:t,height:n},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}};var Gr=class extends Et{constructor(e,t,n,i,r,o,a,c,l){super(e,t,n,i,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},Wr=class extends Et{constructor(e,t,n=ki,i,r,o,a=It,c=It,l,h=ks,u=1){if(h!==ks&&h!==sr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,i,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Pi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Xr=class extends Et{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var gn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),i=0,r=n.length,o;t?o=t:o=e*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(i=Math.floor(a+(c-a)/2),l=n[i]-o,l<0)a=i+1;else if(l>0)c=i-1;else{c=i;break}if(i=c,n[i]===o)return i/(r-1);let h=n[i],f=n[i+1]-h,d=(o-h)/f;return(i+d)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let o=this.getPoint(i),a=this.getPoint(r),c=t||(o.isVector2?new re:new R);return c.copy(a).sub(o).normalize(),c}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new R,i=[],r=[],o=[],a=new R,c=new Ce;for(let d=0;d<=e;d++){let m=d/e;i[d]=this.getTangentAt(m,new R)}r[0]=new R,o[0]=new R;let l=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),f=Math.abs(i[0].z);h<=l&&(l=h,n.set(1,0,0)),u<=l&&(l=u,n.set(0,1,0)),f<=l&&n.set(0,0,1),a.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],a),o[0].crossVectors(i[0],r[0]);for(let d=1;d<=e;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(i[d-1],i[d]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(ze(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(c.makeRotationAxis(a,m))}o[d].crossVectors(i[d],r[d])}if(t===!0){let d=Math.acos(ze(r[0].dot(r[e]),-1,1));d/=e,i[0].dot(a.crossVectors(r[0],r[e]))>0&&(d=-d);for(let m=1;m<=e;m++)r[m].applyMatrix4(c.makeRotationAxis(i[m],d*m)),o[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Ks=class extends gn{constructor(e=0,t=0,n=1,i=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(e,t=new re){let n=t,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(o?r=0:r=i),this.aClockwise===!0&&!o&&(r===i?r=-i:r=r-i);let a=this.aStartAngle+e*r,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=c-this.aX,d=l-this.aY;c=f*h-d*u+this.aX,l=f*u+d*h+this.aY}return n.set(c,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ma=class extends Ks{constructor(e,t,n,i,r,o){super(e,t,n,n,i,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function ch(){let s=0,e=0,t=0,n=0;function i(r,o,a,c){s=r,e=a,t=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){i(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,h,u){let f=(o-r)/l-(a-r)/(l+h)+(a-o)/h,d=(a-o)/h-(c-o)/(h+u)+(c-a)/u;f*=h,d*=h,i(o,a,f,d)},calc:function(r){let o=r*r,a=o*r;return s+e*r+t*o+n*a}}}var aa=new R,bl=new ch,Sl=new ch,wl=new ch,ba=class extends gn{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new R){let n=t,i=this.points,r=i.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,h;this.closed||a>0?l=i[(a-1)%r]:(aa.subVectors(i[0],i[1]).add(i[0]),l=aa);let u=i[a%r],f=i[(a+1)%r];if(this.closed||a+2<r?h=i[(a+2)%r]:(aa.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=aa),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,m=Math.pow(l.distanceToSquared(u),d),_=Math.pow(u.distanceToSquared(f),d),g=Math.pow(f.distanceToSquared(h),d);_<1e-4&&(_=1),m<1e-4&&(m=_),g<1e-4&&(g=_),bl.initNonuniformCatmullRom(l.x,u.x,f.x,h.x,m,_,g),Sl.initNonuniformCatmullRom(l.y,u.y,f.y,h.y,m,_,g),wl.initNonuniformCatmullRom(l.z,u.z,f.z,h.z,m,_,g)}else this.curveType==="catmullrom"&&(bl.initCatmullRom(l.x,u.x,f.x,h.x,this.tension),Sl.initCatmullRom(l.y,u.y,f.y,h.y,this.tension),wl.initCatmullRom(l.z,u.z,f.z,h.z,this.tension));return n.set(bl.calc(c),Sl.calc(c),wl.calc(c)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new R().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function zd(s,e,t,n,i){let r=(n-e)*.5,o=(i-t)*.5,a=s*s,c=s*a;return(2*t-2*n+r+o)*c+(-3*t+3*n-2*r-o)*a+r*s+t}function dg(s,e){let t=1-s;return t*t*e}function fg(s,e){return 2*(1-s)*s*e}function pg(s,e){return s*s*e}function Ar(s,e,t,n){return dg(s,e)+fg(s,t)+pg(s,n)}function mg(s,e){let t=1-s;return t*t*t*e}function gg(s,e){let t=1-s;return 3*t*t*s*e}function _g(s,e){return 3*(1-s)*s*s*e}function xg(s,e){return s*s*s*e}function Rr(s,e,t,n,i){return mg(s,e)+gg(s,t)+_g(s,n)+xg(s,i)}var Yr=class extends gn{constructor(e=new re,t=new re,n=new re,i=new re){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new re){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Rr(e,i.x,r.x,o.x,a.x),Rr(e,i.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Sa=class extends gn{constructor(e=new R,t=new R,n=new R,i=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new R){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Rr(e,i.x,r.x,o.x,a.x),Rr(e,i.y,r.y,o.y,a.y),Rr(e,i.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},qr=class extends gn{constructor(e=new re,t=new re){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new re){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new re){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},wa=class extends gn{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$r=class extends gn{constructor(e=new re,t=new re,n=new re){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new re){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(Ar(e,i.x,r.x,o.x),Ar(e,i.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ta=class extends gn{constructor(e=new R,t=new R,n=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new R){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(Ar(e,i.x,r.x,o.x),Ar(e,i.y,r.y,o.y),Ar(e,i.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Kr=class extends gn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new re){let n=t,i=this.points,r=(i.length-1)*e,o=Math.floor(r),a=r-o,c=i[o===0?o:o-1],l=i[o],h=i[o>i.length-2?i.length-1:o+1],u=i[o>i.length-3?i.length-1:o+2];return n.set(zd(a,c.x,l.x,h.x,u.x),zd(a,c.y,l.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new re().fromArray(i))}return this}},Hd=Object.freeze({__proto__:null,ArcCurve:Ma,CatmullRomCurve3:ba,CubicBezierCurve:Yr,CubicBezierCurve3:Sa,EllipseCurve:Ks,LineCurve:qr,LineCurve3:wa,QuadraticBezierCurve:$r,QuadraticBezierCurve3:Ta,SplineCurve:Kr}),Ea=class extends gn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Hd[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let o=i[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,r=this.curves;i<r.length;i++){let o=r[i],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,c=o.getPoints(a);for(let l=0;l<c.length;l++){let h=c[l];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new Hd[i.type]().fromJSON(i))}return this}},jr=class extends Ea{constructor(e){super(),this.type="Path",this.currentPoint=new re,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new qr(this.currentPoint.clone(),new re(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let r=new $r(this.currentPoint.clone(),new re(e,t),new re(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,o){let a=new Yr(this.currentPoint.clone(),new re(e,t),new re(n,i),new re(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Kr(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+a,t+c,n,i,r,o),this}absarc(e,t,n,i,r,o){return this.absellipse(e,t,n,n,i,r,o),this}ellipse(e,t,n,i,r,o,a,c){let l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+l,t+h,n,i,r,o,a,c),this}absellipse(e,t,n,i,r,o,a,c){let l=new Ks(e,t,n,i,r,o,a,c);if(this.curves.length>0){let u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);let h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},js=class extends jr{constructor(e){super(e),this.uuid=Sn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new jr().fromJSON(i))}return this}};function yg(s,e,t=2){let n=e&&e.length,i=n?e[0]*t:s.length,r=zf(s,0,i,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,c,l;if(n&&(r=wg(s,e,r,t)),s.length>80*t){a=1/0,c=1/0;let h=-1/0,u=-1/0;for(let f=t;f<i;f+=t){let d=s[f],m=s[f+1];d<a&&(a=d),m<c&&(c=m),d>h&&(h=d),m>u&&(u=m)}l=Math.max(h-a,u-c),l=l!==0?32767/l:0}return Zr(r,o,t,a,c,l,0),o}function zf(s,e,t,n,i){let r;if(i===Ug(s,e,t,n)>0)for(let o=e;o<t;o+=n)r=Vd(o/n|0,s[o],s[o+1],r);else for(let o=t-n;o>=e;o-=n)r=Vd(o/n|0,s[o],s[o+1],r);return r&&Zs(r,r.next)&&(Qr(r),r=r.next),r}function rs(s,e){if(!s)return s;e||(e=s);let t=s,n;do if(n=!1,!t.steiner&&(Zs(t,t.next)||Mt(t.prev,t,t.next)===0)){if(Qr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function Zr(s,e,t,n,i,r,o){if(!s)return;!o&&r&&Cg(s,n,i,r);let a=s;for(;s.prev!==s.next;){let c=s.prev,l=s.next;if(r?Mg(s,n,i,r):vg(s)){e.push(c.i,s.i,l.i),Qr(s),s=l.next,a=l.next;continue}if(s=l,s===a){o?o===1?(s=bg(rs(s),e),Zr(s,e,t,n,i,r,2)):o===2&&Sg(s,e,t,n,i,r):Zr(rs(s),e,t,n,i,r,1);break}}}function vg(s){let e=s.prev,t=s,n=s.next;if(Mt(e,t,n)>=0)return!1;let i=e.x,r=t.x,o=n.x,a=e.y,c=t.y,l=n.y,h=Math.min(i,r,o),u=Math.min(a,c,l),f=Math.max(i,r,o),d=Math.max(a,c,l),m=n.next;for(;m!==e;){if(m.x>=h&&m.x<=f&&m.y>=u&&m.y<=d&&wr(i,a,r,c,o,l,m.x,m.y)&&Mt(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Mg(s,e,t,n){let i=s.prev,r=s,o=s.next;if(Mt(i,r,o)>=0)return!1;let a=i.x,c=r.x,l=o.x,h=i.y,u=r.y,f=o.y,d=Math.min(a,c,l),m=Math.min(h,u,f),_=Math.max(a,c,l),g=Math.max(h,u,f),p=Nl(d,m,e,t,n),b=Nl(_,g,e,t,n),v=s.prevZ,x=s.nextZ;for(;v&&v.z>=p&&x&&x.z<=b;){if(v.x>=d&&v.x<=_&&v.y>=m&&v.y<=g&&v!==i&&v!==o&&wr(a,h,c,u,l,f,v.x,v.y)&&Mt(v.prev,v,v.next)>=0||(v=v.prevZ,x.x>=d&&x.x<=_&&x.y>=m&&x.y<=g&&x!==i&&x!==o&&wr(a,h,c,u,l,f,x.x,x.y)&&Mt(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;v&&v.z>=p;){if(v.x>=d&&v.x<=_&&v.y>=m&&v.y<=g&&v!==i&&v!==o&&wr(a,h,c,u,l,f,v.x,v.y)&&Mt(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;x&&x.z<=b;){if(x.x>=d&&x.x<=_&&x.y>=m&&x.y<=g&&x!==i&&x!==o&&wr(a,h,c,u,l,f,x.x,x.y)&&Mt(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function bg(s,e){let t=s;do{let n=t.prev,i=t.next.next;!Zs(n,i)&&Vf(n,t,t.next,i)&&Jr(n,i)&&Jr(i,n)&&(e.push(n.i,t.i,i.i),Qr(t),Qr(t.next),t=s=i),t=t.next}while(t!==s);return rs(t)}function Sg(s,e,t,n,i,r){let o=s;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Lg(o,a)){let c=Gf(o,a);o=rs(o,o.next),c=rs(c,c.next),Zr(o,e,t,n,i,r,0),Zr(c,e,t,n,i,r,0);return}a=a.next}o=o.next}while(o!==s)}function wg(s,e,t,n){let i=[];for(let r=0,o=e.length;r<o;r++){let a=e[r]*n,c=r<o-1?e[r+1]*n:s.length,l=zf(s,a,c,n,!1);l===l.next&&(l.steiner=!0),i.push(Pg(l))}i.sort(Tg);for(let r=0;r<i.length;r++)t=Eg(i[r],t);return t}function Tg(s,e){let t=s.x-e.x;if(t===0&&(t=s.y-e.y,t===0)){let n=(s.next.y-s.y)/(s.next.x-s.x),i=(e.next.y-e.y)/(e.next.x-e.x);t=n-i}return t}function Eg(s,e){let t=Ag(s,e);if(!t)return e;let n=Gf(t,s);return rs(n,n.next),rs(t,t.next)}function Ag(s,e){let t=e,n=s.x,i=s.y,r=-1/0,o;if(Zs(s,t))return t;do{if(Zs(s,t.next))return t.next;if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){let u=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=n&&u>r&&(r=u,o=t.x<t.next.x?t:t.next,u===n))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,c=o.x,l=o.y,h=1/0;t=o;do{if(n>=t.x&&t.x>=c&&n!==t.x&&Hf(i<l?n:r,i,c,l,i<l?r:n,i,t.x,t.y)){let u=Math.abs(i-t.y)/(n-t.x);Jr(t,s)&&(u<h||u===h&&(t.x>o.x||t.x===o.x&&Rg(o,t)))&&(o=t,h=u)}t=t.next}while(t!==a);return o}function Rg(s,e){return Mt(s.prev,s,e.prev)<0&&Mt(e.next,s,s.next)<0}function Cg(s,e,t,n){let i=s;do i.z===0&&(i.z=Nl(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,Ig(i)}function Ig(s){let e,t=1;do{let n=s,i;s=null;let r=null;for(e=0;n;){e++;let o=n,a=0;for(let l=0;l<t&&(a++,o=o.nextZ,!!o);l++);let c=t;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||n.z<=o.z)?(i=n,n=n.nextZ,a--):(i=o,o=o.nextZ,c--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=o}r.nextZ=null,t*=2}while(e>1);return s}function Nl(s,e,t,n,i){return s=(s-t)*i|0,e=(e-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,s|e<<1}function Pg(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function Hf(s,e,t,n,i,r,o,a){return(i-o)*(e-a)>=(s-o)*(r-a)&&(s-o)*(n-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(i-o)*(n-a)}function wr(s,e,t,n,i,r,o,a){return!(s===o&&e===a)&&Hf(s,e,t,n,i,r,o,a)}function Lg(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!Dg(s,e)&&(Jr(s,e)&&Jr(e,s)&&Ng(s,e)&&(Mt(s.prev,s,e.prev)||Mt(s,e.prev,e))||Zs(s,e)&&Mt(s.prev,s,s.next)>0&&Mt(e.prev,e,e.next)>0)}function Mt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function Zs(s,e){return s.x===e.x&&s.y===e.y}function Vf(s,e,t,n){let i=la(Mt(s,e,t)),r=la(Mt(s,e,n)),o=la(Mt(t,n,s)),a=la(Mt(t,n,e));return!!(i!==r&&o!==a||i===0&&ca(s,t,e)||r===0&&ca(s,n,e)||o===0&&ca(t,s,n)||a===0&&ca(t,e,n))}function ca(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function la(s){return s>0?1:s<0?-1:0}function Dg(s,e){let t=s;do{if(t.i!==s.i&&t.next.i!==s.i&&t.i!==e.i&&t.next.i!==e.i&&Vf(t,t.next,s,e))return!0;t=t.next}while(t!==s);return!1}function Jr(s,e){return Mt(s.prev,s,s.next)<0?Mt(s,e,s.next)>=0&&Mt(s,s.prev,e)>=0:Mt(s,e,s.prev)<0||Mt(s,s.next,e)<0}function Ng(s,e){let t=s,n=!1,i=(s.x+e.x)/2,r=(s.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==s);return n}function Gf(s,e){let t=Ul(s.i,s.x,s.y),n=Ul(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function Vd(s,e,t,n){let i=Ul(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Qr(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Ul(s,e,t){return{i:s,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ug(s,e,t,n){let i=0;for(let r=e,o=t-n;r<t;r+=n)i+=(s[o]-s[r])*(s[r+1]+s[o+1]),o=r;return i}var Ol=class{static triangulate(e,t,n=2){return yg(e,t,n)}},Bs=class s{static area(e){let t=e.length,n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return n*.5}static isClockWise(e){return s.area(e)<0}static triangulateShape(e,t){let n=[],i=[],r=[];Gd(e),Wd(n,e);let o=e.length;t.forEach(Gd);for(let c=0;c<t.length;c++)i.push(o),o+=t[c].length,Wd(n,t[c]);let a=Ol.triangulate(n,i);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}};function Gd(s){let e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function Wd(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}var eo=class s extends Pt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,h=c+1,u=e/a,f=t/c,d=[],m=[],_=[],g=[];for(let p=0;p<h;p++){let b=p*f-o;for(let v=0;v<l;v++){let x=v*u-r;m.push(x,-b,0),_.push(0,0,1),g.push(v/a),g.push(1-p/c)}}for(let p=0;p<c;p++)for(let b=0;b<a;b++){let v=b+l*p,x=b+l*(p+1),S=b+1+l*(p+1),T=b+1+l*p;d.push(v,x,T),d.push(x,S,T)}this.setIndex(d),this.setAttribute("position",new Ct(m,3)),this.setAttribute("normal",new Ct(_,3)),this.setAttribute("uv",new Ct(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}};var to=class s extends Pt{constructor(e=new js([new re(0,.5),new re(-.5,-.5),new re(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],r=[],o=[],a=0,c=0;if(Array.isArray(e)===!1)l(e);else for(let h=0;h<e.length;h++)l(e[h]),this.addGroup(a,c,h),a+=c,c=0;this.setIndex(n),this.setAttribute("position",new Ct(i,3)),this.setAttribute("normal",new Ct(r,3)),this.setAttribute("uv",new Ct(o,2));function l(h){let u=i.length/3,f=h.extractPoints(t),d=f.shape,m=f.holes;Bs.isClockWise(d)===!1&&(d=d.reverse());for(let g=0,p=m.length;g<p;g++){let b=m[g];Bs.isClockWise(b)===!0&&(m[g]=b.reverse())}let _=Bs.triangulateShape(d,m);for(let g=0,p=m.length;g<p;g++){let b=m[g];d=d.concat(b)}for(let g=0,p=d.length;g<p;g++){let b=d[g];i.push(b.x,b.y,0),r.push(0,0,1),o.push(b.x,b.y)}for(let g=0,p=_.length;g<p;g++){let b=_[g],v=b[0]+u,x=b[1]+u,S=b[2]+u;n.push(v,x,S),c+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Og(t,e)}static fromJSON(e,t){let n=[];for(let i=0,r=e.shapes.length;i<r;i++){let o=t[e.shapes[i]];n.push(o)}return new s(n,e.curveSegments)}};function Og(s,e){if(e.shapes=[],Array.isArray(s))for(let t=0,n=s.length;t<n;t++){let i=s[t];e.shapes.push(i.uuid)}else e.shapes.push(s.uuid);return e}var no=class s extends Pt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),l=0,h=[],u=new R,f=new R,d=[],m=[],_=[],g=[];for(let p=0;p<=n;p++){let b=[],v=p/n,x=0;p===0&&o===0?x=.5/t:p===n&&c===Math.PI&&(x=-.5/t);for(let S=0;S<=t;S++){let T=S/t;u.x=-e*Math.cos(i+T*r)*Math.sin(o+v*a),u.y=e*Math.cos(o+v*a),u.z=e*Math.sin(i+T*r)*Math.sin(o+v*a),m.push(u.x,u.y,u.z),f.copy(u).normalize(),_.push(f.x,f.y,f.z),g.push(T+x,1-v),b.push(l++)}h.push(b)}for(let p=0;p<n;p++)for(let b=0;b<t;b++){let v=h[p][b+1],x=h[p][b],S=h[p+1][b],T=h[p+1][b+1];(p!==0||o>0)&&d.push(v,x,T),(p!==n-1||c<Math.PI)&&d.push(x,S,T)}this.setIndex(d),this.setAttribute("position",new Ct(m,3)),this.setAttribute("normal",new Ct(_,3)),this.setAttribute("uv",new Ct(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Qt=class extends ln{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new we(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new we(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=nh,this.normalScale=new re(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},qt=class extends Qt{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new re(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ze(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new we(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new we(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new we(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var Aa=class extends ln{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ef,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ra=class extends ln{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ha(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function Fg(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Bg(s){function e(i,r){return s[i]-s[r]}let t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function Xd(s,e,t){let n=s.length,i=new s.constructor(n);for(let r=0,o=0;o!==n;++r){let a=t[r]*e;for(let c=0;c!==e;++c)i[o++]=s[a+c]}return i}function Wf(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push(...o)),r=s[i++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=s[i++];while(r!==void 0)}var hi=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<i)){for(let a=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=i,i=t[++n],e<i)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let o=0;o!==i;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ca=class extends hi{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Cl,endingEnd:Cl}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,o=e+1,a=i[r],c=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case Il:r=e,a=2*t-n;break;case Pl:r=i.length-2,a=t+i[r]-i[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Il:o=e,c=2*n-t;break;case Pl:o=1,c=n+i[1]-i[0];break;default:o=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,m=(n-t)/(i-t),_=m*m,g=_*m,p=-f*g+2*f*_-f*m,b=(1+f)*g+(-1.5-2*f)*_+(-.5+f)*m+1,v=(-1-d)*g+(1.5+d)*_+.5*m,x=d*g-d*_;for(let S=0;S!==a;++S)r[S]=p*o[h+S]+b*o[l+S]+v*o[c+S]+x*o[u+S];return r}},Ia=class extends hi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=(n-t)/(i-t),u=1-h;for(let f=0;f!==a;++f)r[f]=o[l+f]*u+o[c+f]*h;return r}},Pa=class extends hi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},hn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ha(t,this.TimeBufferType),this.values=ha(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ha(e.times,Array),values:ha(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Pa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ia(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ca(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case oi:t=this.InterpolantFactoryMethodDiscrete;break;case ai:t=this.InterpolantFactoryMethodLinear;break;case ua:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return oi;case this.InterpolantFactoryMethodLinear:return ai;case this.InterpolantFactoryMethodSmooth:return ua}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,o=i-1;for(;r!==i&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==i){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(i!==void 0&&Fg(i))for(let a=0,c=i.length;a!==c;++a){let l=i[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===ua,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],h=e[a+1];if(l!==h&&(a!==1||l!==e[0]))if(i)c=!0;else{let u=a*n,f=u-n,d=u+n;for(let m=0;m!==n;++m){let _=t[u+m];if(_!==t[f+m]||_!==t[d+m]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)t[f+d]=t[u+d]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};hn.prototype.ValueTypeName="";hn.prototype.TimeBufferType=Float32Array;hn.prototype.ValueBufferType=Float32Array;hn.prototype.DefaultInterpolation=ai;var ui=class extends hn{constructor(e,t,n){super(e,t,n)}};ui.prototype.ValueTypeName="bool";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=oi;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var io=class extends hn{constructor(e,t,n,i){super(e,t,n,i)}};io.prototype.ValueTypeName="color";var Xn=class extends hn{constructor(e,t,n,i){super(e,t,n,i)}};Xn.prototype.ValueTypeName="number";var La=class extends hi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(i-t),l=e*a;for(let h=l+a;l!==h;l+=4)Vt.slerpFlat(r,0,o,l-a,o,l,c);return r}},Yn=class extends hn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new La(this.times,this.values,this.getValueSize(),e)}};Yn.prototype.ValueTypeName="quaternion";Yn.prototype.InterpolantFactoryMethodSmooth=void 0;var di=class extends hn{constructor(e,t,n){super(e,t,n)}};di.prototype.ValueTypeName="string";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=oi;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var qn=class extends hn{constructor(e,t,n,i){super(e,t,n,i)}};qn.prototype.ValueTypeName="vector";var so=class{constructor(e="",t=-1,n=[],i=Tf){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=Sn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(zg(n[o]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,o=n.length;r!==o;++r)t.push(hn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);let h=Bg(c);c=Xd(c,1,h),l=Xd(l,1,h),!i&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new Xn(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){let l=e[a],h=l.name.match(r);if(h&&h.length>1){let u=h[1],f=i[u];f||(i[u]=f=[]),f.push(l)}}let o=[];for(let a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],t,n));return o}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let n=function(u,f,d,m,_){if(d.length!==0){let g=[],p=[];Wf(d,g,p,m),g.length!==0&&_.push(new u(f,g,p))}},i=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,c=e.length||-1,l=e.hierarchy||[];for(let u=0;u<l.length;u++){let f=l[u].keys;if(!(!f||f.length===0))if(f[0].morphTargets){let d={},m;for(m=0;m<f.length;m++)if(f[m].morphTargets)for(let _=0;_<f[m].morphTargets.length;_++)d[f[m].morphTargets[_]]=-1;for(let _ in d){let g=[],p=[];for(let b=0;b!==f[m].morphTargets.length;++b){let v=f[m];g.push(v.time),p.push(v.morphTarget===_?1:0)}i.push(new Xn(".morphTargetInfluence["+_+"]",g,p))}c=d.length*o}else{let d=".bones["+t[u].name+"]";n(qn,d+".position",f,"pos",i),n(Yn,d+".quaternion",f,"rot",i),n(qn,d+".scale",f,"scl",i)}}return i.length===0?null:new this(r,c,i,a)}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function kg(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Xn;case"vector":case"vector2":case"vector3":case"vector4":return qn;case"color":return io;case"quaternion":return Yn;case"bool":case"boolean":return ui;case"string":return di}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function zg(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=kg(s.type);if(s.times===void 0){let t=[],n=[];Wf(s.keys,t,n,"value"),s.times=t,s.values=n}return e.parse!==void 0?e.parse(s):new e(s.name,s.times,s.values,s.interpolation)}var Hn={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}},Da=class{constructor(e,t,n){let i=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(h){a++,r===!1&&i.onStart!==void 0&&i.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=l.length;u<f;u+=2){let d=l[u],m=l[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Xf=new Da,$n=class{constructor(e){this.manager=e!==void 0?e:Xf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};$n.DEFAULT_MATERIAL_NAME="__DEFAULT";var si={},Fl=class extends Error{constructor(e,t){super(e),this.response=t}},Js=class extends $n{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=Hn.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(si[e]!==void 0){si[e].push({onLoad:t,onProgress:n,onError:i});return}si[e]=[],si[e].push({onLoad:t,onProgress:n,onError:i});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=si[e],u=l.body.getReader(),f=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),d=f?parseInt(f):0,m=d!==0,_=0,g=new ReadableStream({start(p){b();function b(){u.read().then(({done:v,value:x})=>{if(v)p.close();else{_+=x.byteLength;let S=new ProgressEvent("progress",{lengthComputable:m,loaded:_,total:d});for(let T=0,C=h.length;T<C;T++){let N=h[T];N.onProgress&&N.onProgress(S)}p.enqueue(x),b()}},v=>{p.error(v)})}}});return new Response(g)}else throw new Fl(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a==="")return l.text();{let u=/charset="?([^;"\s]*)"?/i.exec(a),f=u&&u[1]?u[1].toLowerCase():void 0,d=new TextDecoder(f);return l.arrayBuffer().then(m=>d.decode(m))}}}).then(l=>{Hn.add(`file:${e}`,l);let h=si[e];delete si[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onLoad&&d.onLoad(l)}}).catch(l=>{let h=si[e];if(h===void 0)throw this.manager.itemError(e),l;delete si[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onError&&d.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Os=new WeakMap,Na=class extends $n{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Hn.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let u=Os.get(o);u===void 0&&(u=[],Os.set(o,u)),u.push({onLoad:t,onError:i})}return o}let a=zs("img");function c(){h(),t&&t(this);let u=Os.get(this)||[];for(let f=0;f<u.length;f++){let d=u[f];d.onLoad&&d.onLoad(this)}Os.delete(this),r.manager.itemEnd(e)}function l(u){h(),i&&i(u),Hn.remove(`image:${e}`);let f=Os.get(this)||[];for(let d=0;d<f.length;d++){let m=f[d];m.onError&&m.onError(u)}Os.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),Hn.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var ro=class extends $n{constructor(e){super(e)}load(e,t,n,i){let r=new Et,o=new Na(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}},Ni=class extends ut{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new we(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},oo=class extends Ni{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.groundColor=new we(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Tl=new Ce,Yd=new R,qd=new R,ao=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new re(512,512),this.mapType=Fn,this.map=null,this.mapPass=null,this.matrix=new Ce,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qs,this._frameExtents=new re(1,1),this._viewportCount=1,this._viewports=[new Je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Yd.setFromMatrixPosition(e.matrixWorld),t.position.copy(Yd),qd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(qd),t.updateMatrixWorld(),Tl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Tl,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Tl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Bl=class extends ao{constructor(){super(new Tt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=ts*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},os=class extends Ni{constructor(e,t,n=0,i=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.distance=n,this.angle=i,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new Bl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},$d=new Ce,Sr=new R,El=new R,kl=class extends ao{constructor(){super(new Tt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new re(4,2),this._viewportCount=6,this._viewports=[new Je(2,1,1,1),new Je(0,1,1,1),new Je(3,1,1,1),new Je(1,1,1,1),new Je(3,0,1,1),new Je(1,0,1,1)],this._cubeDirections=[new R(1,0,0),new R(-1,0,0),new R(0,0,1),new R(0,0,-1),new R(0,1,0),new R(0,-1,0)],this._cubeUps=[new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,0,1),new R(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Sr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Sr),El.copy(n.position),El.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(El),n.updateMatrixWorld(),i.makeTranslation(-Sr.x,-Sr.y,-Sr.z),$d.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix($d,n.coordinateSystem,n.reversedDepth)}},as=class extends Ni{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new kl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},fi=class extends Ur{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},zl=class extends ao{constructor(){super(new fi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ui=class extends Ni{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.shadow=new zl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},co=class extends Ni{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var pi=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var Al=new WeakMap,lo=class extends $n{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Hn.get(`image-bitmap:${e}`);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{if(Al.has(o)===!0)i&&i(Al.get(o)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(l),r.manager.itemEnd(e),l});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return Hn.add(`image-bitmap:${e}`,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){i&&i(l),Al.set(c,l),Hn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Hn.add(`image-bitmap:${e}`,c),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Ua=class extends Tt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var lh="\\[\\]\\.:\\/",Hg=new RegExp("["+lh+"]","g"),hh="[^"+lh+"]",Vg="[^"+lh.replace("\\.","")+"]",Gg=/((?:WC+[\/:])*)/.source.replace("WC",hh),Wg=/(WCOD+)?/.source.replace("WCOD",Vg),Xg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",hh),Yg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",hh),qg=new RegExp("^"+Gg+Wg+Xg+Yg+"$"),$g=["material","materials","bones","map"],Hl=class{constructor(e,t,n){let i=n||Ze.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ze=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Hg,"")}static parseTrackName(e){let t=qg.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);$g.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[i];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ze.Composite=Hl;Ze.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ze.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ze.prototype.GetterByBindingType=[Ze.prototype._getValue_direct,Ze.prototype._getValue_array,Ze.prototype._getValue_arrayElement,Ze.prototype._getValue_toArray];Ze.prototype.SetterByBindingTypeAndVersioning=[[Ze.prototype._setValue_direct,Ze.prototype._setValue_direct_setNeedsUpdate,Ze.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_array,Ze.prototype._setValue_array_setNeedsUpdate,Ze.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_arrayElement,Ze.prototype._setValue_arrayElement_setNeedsUpdate,Ze.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ze.prototype._setValue_fromArray,Ze.prototype._setValue_fromArray_setNeedsUpdate,Ze.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var WM=new Float32Array(1);var Qs=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=ze(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(ze(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var ho=class extends Gn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function uh(s,e,t,n){let i=Kg(n);switch(t){case Jl:return s*e;case ja:return s*e/i.components*i.byteLength;case Za:return s*e/i.components*i.byteLength;case eh:return s*e*2/i.components*i.byteLength;case Ja:return s*e*2/i.components*i.byteLength;case Ql:return s*e*3/i.components*i.byteLength;case tn:return s*e*4/i.components*i.byteLength;case Qa:return s*e*4/i.components*i.byteLength;case po:case mo:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case go:case _o:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case tc:case ic:return Math.max(s,16)*Math.max(e,8)/4;case ec:case nc:return Math.max(s,8)*Math.max(e,8)/2;case sc:case rc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case oc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case ac:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case cc:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case lc:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case hc:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case uc:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case dc:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case fc:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case pc:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case mc:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case gc:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case _c:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case xc:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case yc:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case vc:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case Mc:case bc:case Sc:return Math.ceil(s/4)*Math.ceil(e/4)*16;case wc:case Tc:return Math.ceil(s/4)*Math.ceil(e/4)*8;case Ec:case Ac:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Kg(s){switch(s){case Fn:case $l:return{byteLength:1,components:1};case tr:case Kl:case nr:return{byteLength:2,components:1};case $a:case Ka:return{byteLength:2,components:4};case ki:case qa:case wn:return{byteLength:4,components:1};case jl:case Zl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function mp(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function jg(s){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,u=l.byteLength,f=s.createBuffer();s.bindBuffer(c,f),s.bufferData(c,l,h),a.onUploadCallback();let d;if(l instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=s.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=s.SHORT;else if(l instanceof Uint32Array)d=s.UNSIGNED_INT;else if(l instanceof Int32Array)d=s.INT;else if(l instanceof Int8Array)d=s.BYTE;else if(l instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,l){let h=c.array,u=c.updateRanges;if(s.bindBuffer(l,a),u.length===0)s.bufferSubData(l,0,h);else{u.sort((d,m)=>d.start-m.start);let f=0;for(let d=1;d<u.length;d++){let m=u[f],_=u[d];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++f,u[f]=_)}u.length=f+1;for(let d=0,m=u.length;d<m;d++){let _=u[d];s.bufferSubData(l,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(s.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:i,remove:r,update:o}}var Zg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Jg=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Qg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,e0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,t0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,n0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,i0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,s0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,r0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,o0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,a0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,c0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,l0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,h0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,u0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,d0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,f0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,p0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,m0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,g0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,_0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,x0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,y0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,v0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,M0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,b0=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,S0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,w0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,T0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,E0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,A0="gl_FragColor = linearToOutputTexel( gl_FragColor );",R0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,C0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,I0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,P0=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,L0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,D0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,N0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,U0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,O0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,F0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,B0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,k0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,z0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,H0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,V0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,G0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,W0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,X0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Y0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,q0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,$0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,K0=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,j0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Z0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,J0=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Q0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,e_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,t_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,n_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,i_=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,s_=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,r_=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,o_=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,a_=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,c_=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,l_=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,h_=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,u_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,d_=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,f_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,p_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,m_=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,g_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,__=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,x_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,y_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,v_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,M_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,b_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,S_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,w_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,T_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,E_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,A_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,R_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,C_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,I_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,P_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,L_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,D_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,N_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,U_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,O_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,F_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,B_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,k_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,z_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,H_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,V_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,G_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,W_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,X_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Y_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,q_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,K_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,j_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Z_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,J_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Q_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ex=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ix=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,sx=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,rx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,ox=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ax=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cx=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,lx=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,hx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,ux=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dx=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,px=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,mx=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gx=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,_x=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,xx=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vx=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Mx=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wx=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Tx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ex=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ax=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Rx=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Cx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ve={alphahash_fragment:Zg,alphahash_pars_fragment:Jg,alphamap_fragment:Qg,alphamap_pars_fragment:e0,alphatest_fragment:t0,alphatest_pars_fragment:n0,aomap_fragment:i0,aomap_pars_fragment:s0,batching_pars_vertex:r0,batching_vertex:o0,begin_vertex:a0,beginnormal_vertex:c0,bsdfs:l0,iridescence_fragment:h0,bumpmap_pars_fragment:u0,clipping_planes_fragment:d0,clipping_planes_pars_fragment:f0,clipping_planes_pars_vertex:p0,clipping_planes_vertex:m0,color_fragment:g0,color_pars_fragment:_0,color_pars_vertex:x0,color_vertex:y0,common:v0,cube_uv_reflection_fragment:M0,defaultnormal_vertex:b0,displacementmap_pars_vertex:S0,displacementmap_vertex:w0,emissivemap_fragment:T0,emissivemap_pars_fragment:E0,colorspace_fragment:A0,colorspace_pars_fragment:R0,envmap_fragment:C0,envmap_common_pars_fragment:I0,envmap_pars_fragment:P0,envmap_pars_vertex:L0,envmap_physical_pars_fragment:G0,envmap_vertex:D0,fog_vertex:N0,fog_pars_vertex:U0,fog_fragment:O0,fog_pars_fragment:F0,gradientmap_pars_fragment:B0,lightmap_pars_fragment:k0,lights_lambert_fragment:z0,lights_lambert_pars_fragment:H0,lights_pars_begin:V0,lights_toon_fragment:W0,lights_toon_pars_fragment:X0,lights_phong_fragment:Y0,lights_phong_pars_fragment:q0,lights_physical_fragment:$0,lights_physical_pars_fragment:K0,lights_fragment_begin:j0,lights_fragment_maps:Z0,lights_fragment_end:J0,logdepthbuf_fragment:Q0,logdepthbuf_pars_fragment:e_,logdepthbuf_pars_vertex:t_,logdepthbuf_vertex:n_,map_fragment:i_,map_pars_fragment:s_,map_particle_fragment:r_,map_particle_pars_fragment:o_,metalnessmap_fragment:a_,metalnessmap_pars_fragment:c_,morphinstance_vertex:l_,morphcolor_vertex:h_,morphnormal_vertex:u_,morphtarget_pars_vertex:d_,morphtarget_vertex:f_,normal_fragment_begin:p_,normal_fragment_maps:m_,normal_pars_fragment:g_,normal_pars_vertex:__,normal_vertex:x_,normalmap_pars_fragment:y_,clearcoat_normal_fragment_begin:v_,clearcoat_normal_fragment_maps:M_,clearcoat_pars_fragment:b_,iridescence_pars_fragment:S_,opaque_fragment:w_,packing:T_,premultiplied_alpha_fragment:E_,project_vertex:A_,dithering_fragment:R_,dithering_pars_fragment:C_,roughnessmap_fragment:I_,roughnessmap_pars_fragment:P_,shadowmap_pars_fragment:L_,shadowmap_pars_vertex:D_,shadowmap_vertex:N_,shadowmask_pars_fragment:U_,skinbase_vertex:O_,skinning_pars_vertex:F_,skinning_vertex:B_,skinnormal_vertex:k_,specularmap_fragment:z_,specularmap_pars_fragment:H_,tonemapping_fragment:V_,tonemapping_pars_fragment:G_,transmission_fragment:W_,transmission_pars_fragment:X_,uv_pars_fragment:Y_,uv_pars_vertex:q_,uv_vertex:$_,worldpos_vertex:K_,background_vert:j_,background_frag:Z_,backgroundCube_vert:J_,backgroundCube_frag:Q_,cube_vert:ex,cube_frag:tx,depth_vert:nx,depth_frag:ix,distanceRGBA_vert:sx,distanceRGBA_frag:rx,equirect_vert:ox,equirect_frag:ax,linedashed_vert:cx,linedashed_frag:lx,meshbasic_vert:hx,meshbasic_frag:ux,meshlambert_vert:dx,meshlambert_frag:fx,meshmatcap_vert:px,meshmatcap_frag:mx,meshnormal_vert:gx,meshnormal_frag:_x,meshphong_vert:xx,meshphong_frag:yx,meshphysical_vert:vx,meshphysical_frag:Mx,meshtoon_vert:bx,meshtoon_frag:Sx,points_vert:wx,points_frag:Tx,shadow_vert:Ex,shadow_frag:Ax,sprite_vert:Rx,sprite_frag:Cx},oe={common:{diffuse:{value:new we(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},envMapRotation:{value:new Fe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new we(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new we(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new we(16777215)},opacity:{value:1},center:{value:new re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},jn={basic:{uniforms:$t([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:$t([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new we(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:$t([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new we(0)},specular:{value:new we(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:$t([oe.common,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.roughnessmap,oe.metalnessmap,oe.fog,oe.lights,{emissive:{value:new we(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:$t([oe.common,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.gradientmap,oe.fog,oe.lights,{emissive:{value:new we(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:$t([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:$t([oe.points,oe.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:$t([oe.common,oe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:$t([oe.common,oe.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:$t([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:$t([oe.sprite,oe.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Fe}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:$t([oe.common,oe.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:$t([oe.lights,oe.fog,{color:{value:new we(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};jn.physical={uniforms:$t([jn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new we(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new we(0)},specularColor:{value:new we(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};var Rc={r:0,b:0,g:0},us=new Dn,Ix=new Ce;function Px(s,e,t,n,i,r,o){let a=new we(0),c=r===!0?0:1,l,h,u=null,f=0,d=null;function m(v){let x=v.isScene===!0?v.background:null;return x&&x.isTexture&&(x=(v.backgroundBlurriness>0?t:e).get(x)),x}function _(v){let x=!1,S=m(v);S===null?p(a,c):S&&S.isColor&&(p(S,1),x=!0);let T=s.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(s.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function g(v,x){let S=m(x);S&&(S.isCubeTexture||S.mapping===fo)?(h===void 0&&(h=new pt(new li(1,1,1),new Un({name:"BackgroundCubeMaterial",uniforms:hs(jn.backgroundCube.uniforms),vertexShader:jn.backgroundCube.vertexShader,fragmentShader:jn.backgroundCube.fragmentShader,side:en,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(T,C,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),us.copy(x.backgroundRotation),us.x*=-1,us.y*=-1,us.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(us.y*=-1,us.z*=-1),h.material.uniforms.envMap.value=S,h.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Ix.makeRotationFromEuler(us)),h.material.toneMapped=qe.getTransfer(S.colorSpace)!==st,(u!==S||f!==S.version||d!==s.toneMapping)&&(h.material.needsUpdate=!0,u=S,f=S.version,d=s.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new pt(new eo(2,2),new Un({name:"BackgroundMaterial",uniforms:hs(jn.background.uniforms),vertexShader:jn.background.vertexShader,fragmentShader:jn.background.fragmentShader,side:Ln,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,l.material.toneMapped=qe.getTransfer(S.colorSpace)!==st,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||f!==S.version||d!==s.toneMapping)&&(l.material.needsUpdate=!0,u=S,f=S.version,d=s.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function p(v,x){v.getRGB(Rc,ah(s)),n.buffers.color.setClear(Rc.r,Rc.g,Rc.b,x,o)}function b(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,x=1){a.set(v),c=x,p(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(v){c=v,p(a,c)},render:_,addToRenderList:g,dispose:b}}function Lx(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=f(null),r=i,o=!1;function a(w,P,k,z,X){let G=!1,Y=u(z,k,P);r!==Y&&(r=Y,l(r.object)),G=d(w,z,k,X),G&&m(w,z,k,X),X!==null&&e.update(X,s.ELEMENT_ARRAY_BUFFER),(G||o)&&(o=!1,x(w,P,k,z),X!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function c(){return s.createVertexArray()}function l(w){return s.bindVertexArray(w)}function h(w){return s.deleteVertexArray(w)}function u(w,P,k){let z=k.wireframe===!0,X=n[w.id];X===void 0&&(X={},n[w.id]=X);let G=X[P.id];G===void 0&&(G={},X[P.id]=G);let Y=G[z];return Y===void 0&&(Y=f(c()),G[z]=Y),Y}function f(w){let P=[],k=[],z=[];for(let X=0;X<t;X++)P[X]=0,k[X]=0,z[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:k,attributeDivisors:z,object:w,attributes:{},index:null}}function d(w,P,k,z){let X=r.attributes,G=P.attributes,Y=0,J=k.getAttributes();for(let H in J)if(J[H].location>=0){let ue=X[H],Te=G[H];if(Te===void 0&&(H==="instanceMatrix"&&w.instanceMatrix&&(Te=w.instanceMatrix),H==="instanceColor"&&w.instanceColor&&(Te=w.instanceColor)),ue===void 0||ue.attribute!==Te||Te&&ue.data!==Te.data)return!0;Y++}return r.attributesNum!==Y||r.index!==z}function m(w,P,k,z){let X={},G=P.attributes,Y=0,J=k.getAttributes();for(let H in J)if(J[H].location>=0){let ue=G[H];ue===void 0&&(H==="instanceMatrix"&&w.instanceMatrix&&(ue=w.instanceMatrix),H==="instanceColor"&&w.instanceColor&&(ue=w.instanceColor));let Te={};Te.attribute=ue,ue&&ue.data&&(Te.data=ue.data),X[H]=Te,Y++}r.attributes=X,r.attributesNum=Y,r.index=z}function _(){let w=r.newAttributes;for(let P=0,k=w.length;P<k;P++)w[P]=0}function g(w){p(w,0)}function p(w,P){let k=r.newAttributes,z=r.enabledAttributes,X=r.attributeDivisors;k[w]=1,z[w]===0&&(s.enableVertexAttribArray(w),z[w]=1),X[w]!==P&&(s.vertexAttribDivisor(w,P),X[w]=P)}function b(){let w=r.newAttributes,P=r.enabledAttributes;for(let k=0,z=P.length;k<z;k++)P[k]!==w[k]&&(s.disableVertexAttribArray(k),P[k]=0)}function v(w,P,k,z,X,G,Y){Y===!0?s.vertexAttribIPointer(w,P,k,X,G):s.vertexAttribPointer(w,P,k,z,X,G)}function x(w,P,k,z){_();let X=z.attributes,G=k.getAttributes(),Y=P.defaultAttributeValues;for(let J in G){let H=G[J];if(H.location>=0){let ae=X[J];if(ae===void 0&&(J==="instanceMatrix"&&w.instanceMatrix&&(ae=w.instanceMatrix),J==="instanceColor"&&w.instanceColor&&(ae=w.instanceColor)),ae!==void 0){let ue=ae.normalized,Te=ae.itemSize,Ge=e.get(ae);if(Ge===void 0)continue;let lt=Ge.buffer,mt=Ge.type,et=Ge.bytesPerElement,q=mt===s.INT||mt===s.UNSIGNED_INT||ae.gpuType===qa;if(ae.isInterleavedBufferAttribute){let Z=ae.data,pe=Z.stride,Ne=ae.offset;if(Z.isInstancedInterleavedBuffer){for(let Se=0;Se<H.locationSize;Se++)p(H.location+Se,Z.meshPerAttribute);w.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let Se=0;Se<H.locationSize;Se++)g(H.location+Se);s.bindBuffer(s.ARRAY_BUFFER,lt);for(let Se=0;Se<H.locationSize;Se++)v(H.location+Se,Te/H.locationSize,mt,ue,pe*et,(Ne+Te/H.locationSize*Se)*et,q)}else{if(ae.isInstancedBufferAttribute){for(let Z=0;Z<H.locationSize;Z++)p(H.location+Z,ae.meshPerAttribute);w.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let Z=0;Z<H.locationSize;Z++)g(H.location+Z);s.bindBuffer(s.ARRAY_BUFFER,lt);for(let Z=0;Z<H.locationSize;Z++)v(H.location+Z,Te/H.locationSize,mt,ue,Te*et,Te/H.locationSize*Z*et,q)}}else if(Y!==void 0){let ue=Y[J];if(ue!==void 0)switch(ue.length){case 2:s.vertexAttrib2fv(H.location,ue);break;case 3:s.vertexAttrib3fv(H.location,ue);break;case 4:s.vertexAttrib4fv(H.location,ue);break;default:s.vertexAttrib1fv(H.location,ue)}}}}b()}function S(){N();for(let w in n){let P=n[w];for(let k in P){let z=P[k];for(let X in z)h(z[X].object),delete z[X];delete P[k]}delete n[w]}}function T(w){if(n[w.id]===void 0)return;let P=n[w.id];for(let k in P){let z=P[k];for(let X in z)h(z[X].object),delete z[X];delete P[k]}delete n[w.id]}function C(w){for(let P in n){let k=n[P];if(k[w.id]===void 0)continue;let z=k[w.id];for(let X in z)h(z[X].object),delete z[X];delete k[w.id]}}function N(){E(),o=!0,r!==i&&(r=i,l(r.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:N,resetDefaultState:E,dispose:S,releaseStatesOfGeometry:T,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:g,disableUnusedAttributes:b}}function Dx(s,e,t){let n;function i(l){n=l}function r(l,h){s.drawArrays(n,l,h),t.update(h,n,1)}function o(l,h,u){u!==0&&(s.drawArraysInstanced(n,l,h,u),t.update(h,n,u))}function a(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let d=0;for(let m=0;m<u;m++)d+=h[m];t.update(d,n,1)}function c(l,h,u,f){if(u===0)return;let d=e.get("WEBGL_multi_draw");if(d===null)for(let m=0;m<l.length;m++)o(l[m],h[m],f[m]);else{d.multiDrawArraysInstancedWEBGL(n,l,0,h,0,f,0,u);let m=0;for(let _=0;_<u;_++)m+=h[_]*f[_];t.update(m,n,1)}}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Nx(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(C){return!(C!==tn&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let N=C===nr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Fn&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==wn&&!N)}function c(C){if(C==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),g=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),p=s.getParameter(s.MAX_VERTEX_ATTRIBS),b=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),v=s.getParameter(s.MAX_VARYING_VECTORS),x=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),S=m>0,T=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:b,maxVaryings:v,maxFragmentUniforms:x,vertexTextures:S,maxSamples:T}}function Ux(s){let e=this,t=null,n=0,i=!1,r=!1,o=new an,a=new Fe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||i;return i=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){t=h(u,f,0)},this.setState=function(u,f,d){let m=u.clippingPlanes,_=u.clipIntersection,g=u.clipShadows,p=s.get(u);if(!i||m===null||m.length===0||r&&!g)r?h(null):l();else{let b=r?0:n,v=b*4,x=p.clippingState||null;c.value=x,x=h(m,f,v,d);for(let S=0;S!==v;++S)x[S]=t[S];p.clippingState=x,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,f,d,m){let _=u!==null?u.length:0,g=null;if(_!==0){if(g=c.value,m!==!0||g===null){let p=d+_*4,b=f.matrixWorldInverse;a.getNormalMatrix(b),(g===null||g.length<p)&&(g=new Float32Array(p));for(let v=0,x=d;v!==_;++v,x+=4)o.copy(u[v]).applyMatrix4(b,a),o.normal.toArray(g,x),g[x+3]=o.constant}c.value=g,c.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,g}}function Ox(s){let e=new WeakMap;function t(o,a){return a===Xa?o.mapping=cs:a===Ya&&(o.mapping=ls),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Xa||a===Ya)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let l=new xa(c.height);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){let a=o.target;a.removeEventListener("dispose",i);let c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var ar=4,Yf=[.125,.215,.35,.446,.526,.582],ps=20,dh=new fi,qf=new we,fh=null,ph=0,mh=0,gh=!1,fs=(1+Math.sqrt(5))/2,or=1/fs,$f=[new R(-fs,or,0),new R(fs,or,0),new R(-or,0,fs),new R(or,0,fs),new R(0,fs,-or),new R(0,fs,or),new R(-1,1,-1),new R(1,1,-1),new R(-1,1,1),new R(1,1,1)],Fx=new R,Pc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100,r={}){let{size:o=256,position:a=Fx}=r;fh=this._renderer.getRenderTarget(),ph=this._renderer.getActiveCubeFace(),mh=this._renderer.getActiveMipmapLevel(),gh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,i,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Zf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=jf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(fh,ph,mh),this._renderer.xr.enabled=gh,e.scissorTest=!1,Cc(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===cs||e.mapping===ls?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),fh=this._renderer.getRenderTarget(),ph=this._renderer.getActiveCubeFace(),mh=this._renderer.getActiveMipmapLevel(),gh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:zt,minFilter:zt,generateMipmaps:!1,type:nr,format:tn,colorSpace:Ht,depthBuffer:!1},i=Kf(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Kf(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Bx(r)),this._blurMaterial=kx(r,e,t)}return i}_compileMaterial(e){let t=new pt(this._lodPlanes[0],e);this._renderer.compile(t,dh)}_sceneToCubeUV(e,t,n,i,r){let c=new Tt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(qf),u.toneMapping=gi,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null));let _=new Nn({name:"PMREM.Background",side:en,depthWrite:!1,depthTest:!1}),g=new pt(new li,_),p=!1,b=e.background;b?b.isColor&&(_.color.copy(b),e.background=null,p=!0):(_.color.copy(qf),p=!0);for(let v=0;v<6;v++){let x=v%3;x===0?(c.up.set(0,l[v],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[v],r.y,r.z)):x===1?(c.up.set(0,0,l[v]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[v],r.z)):(c.up.set(0,l[v],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[v]));let S=this._cubeSize;Cc(i,x*S,v>2?S:0,S,S),u.setRenderTarget(i),p&&u.render(g,c),u.render(e,c)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=b}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===cs||e.mapping===ls;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Zf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=jf());let r=i?this._cubemapMaterial:this._equirectMaterial,o=new pt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;Cc(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,dh)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let r=1;r<i;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=$f[(i-r-1)%$f.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,i,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new pt(this._lodPlanes[i],l),f=l.uniforms,d=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*ps-1),_=r/m,g=isFinite(r)?1+Math.floor(h*_):ps;g>ps&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${ps}`);let p=[],b=0;for(let C=0;C<ps;++C){let N=C/_,E=Math.exp(-N*N/2);p.push(E),C===0?b+=E:C<g&&(b+=2*E)}for(let C=0;C<p.length;C++)p[C]=p[C]/b;f.envMap.value=e.texture,f.samples.value=g,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:v}=this;f.dTheta.value=m,f.mipInt.value=v-n;let x=this._sizeLods[i],S=3*x*(i>v-ar?i-v+ar:0),T=4*(this._cubeSize-x);Cc(t,S,T,3*x,2*x),c.setRenderTarget(t),c.render(u,dh)}};function Bx(s){let e=[],t=[],n=[],i=s,r=s-ar+1+Yf.length;for(let o=0;o<r;o++){let a=Math.pow(2,i);t.push(a);let c=1/a;o>s-ar?c=Yf[o-s+ar-1]:o===0&&(c=0),n.push(c);let l=1/(a-2),h=-l,u=1+l,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,m=6,_=3,g=2,p=1,b=new Float32Array(_*m*d),v=new Float32Array(g*m*d),x=new Float32Array(p*m*d);for(let T=0;T<d;T++){let C=T%3*2/3-1,N=T>2?0:-1,E=[C,N,0,C+2/3,N,0,C+2/3,N+1,0,C,N,0,C+2/3,N+1,0,C,N+1,0];b.set(E,_*m*T),v.set(f,g*m*T);let w=[T,T,T,T,T,T];x.set(w,p*m*T)}let S=new Pt;S.setAttribute("position",new Ke(b,_)),S.setAttribute("uv",new Ke(v,g)),S.setAttribute("faceIndex",new Ke(x,p)),e.push(S),i>ar&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Kf(s,e,t){let n=new Wn(s,e,t);return n.texture.mapping=fo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Cc(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function kx(s,e,t){let n=new Float32Array(ps),i=new R(0,1,0);return new Un({name:"SphericalGaussianBlur",defines:{n:ps,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Ah(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function jf(){return new Un({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ah(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function Zf(){return new Un({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ah(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function Ah(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function zx(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let c=a.mapping,l=c===Xa||c===Ya,h=c===cs||c===ls;if(l||h){let u=e.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new Pc(s)),u=l?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let d=a.image;return l&&d&&d.height>0||h&&d&&i(d)?(t===null&&(t=new Pc(s)),u=l?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function i(a){let c=0,l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){let c=a.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function Hx(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&Hs("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Vx(s,e,t,n){let i={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&e.remove(f.index);for(let m in f.attributes)e.remove(f.attributes[m]);f.removeEventListener("dispose",o),delete i[f.id];let d=r.get(f);d&&(e.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(u,f){return i[f.id]===!0||(f.addEventListener("dispose",o),i[f.id]=!0,t.memory.geometries++),f}function c(u){let f=u.attributes;for(let d in f)e.update(f[d],s.ARRAY_BUFFER)}function l(u){let f=[],d=u.index,m=u.attributes.position,_=0;if(d!==null){let b=d.array;_=d.version;for(let v=0,x=b.length;v<x;v+=3){let S=b[v+0],T=b[v+1],C=b[v+2];f.push(S,T,T,C,C,S)}}else if(m!==void 0){let b=m.array;_=m.version;for(let v=0,x=b.length/3-1;v<x;v+=3){let S=v+0,T=v+1,C=v+2;f.push(S,T,T,C,C,S)}}else return;let g=new(oh(f)?Nr:Dr)(f,1);g.version=_;let p=r.get(u);p&&e.remove(p),r.set(u,g)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&l(u)}else l(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function Gx(s,e,t){let n;function i(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function c(f,d){s.drawElements(n,d,r,f*o),t.update(d,n,1)}function l(f,d,m){m!==0&&(s.drawElementsInstanced(n,d,r,f*o,m),t.update(d,n,m))}function h(f,d,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,m);let g=0;for(let p=0;p<m;p++)g+=d[p];t.update(g,n,1)}function u(f,d,m,_){if(m===0)return;let g=e.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<f.length;p++)l(f[p]/o,d[p],_[p]);else{g.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,_,0,m);let p=0;for(let b=0;b<m;b++)p+=d[b]*_[b];t.update(p,n,1)}}this.setMode=i,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Wx(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=a*(r/3);break;case s.LINES:t.lines+=a*(r/2);break;case s.LINE_STRIP:t.lines+=a*(r-1);break;case s.LINE_LOOP:t.lines+=a*r;break;case s.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Xx(s,e,t){let n=new WeakMap,i=new Je;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(a);if(f===void 0||f.count!==u){let E=function(){C.dispose(),n.delete(a),a.removeEventListener("dispose",E)};f!==void 0&&f.texture.dispose();let d=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],b=a.morphAttributes.color||[],v=0;d===!0&&(v=1),m===!0&&(v=2),_===!0&&(v=3);let x=a.attributes.position.count*v,S=1;x>e.maxTextureSize&&(S=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let T=new Float32Array(x*S*4*u),C=new Pr(T,x,S,u);C.type=wn,C.needsUpdate=!0;let N=v*4;for(let w=0;w<u;w++){let P=g[w],k=p[w],z=b[w],X=x*S*4*w;for(let G=0;G<P.count;G++){let Y=G*N;d===!0&&(i.fromBufferAttribute(P,G),T[X+Y+0]=i.x,T[X+Y+1]=i.y,T[X+Y+2]=i.z,T[X+Y+3]=0),m===!0&&(i.fromBufferAttribute(k,G),T[X+Y+4]=i.x,T[X+Y+5]=i.y,T[X+Y+6]=i.z,T[X+Y+7]=0),_===!0&&(i.fromBufferAttribute(z,G),T[X+Y+8]=i.x,T[X+Y+9]=i.y,T[X+Y+10]=i.z,T[X+Y+11]=z.itemSize===4?i.w:1)}}f={count:u,texture:C,size:new re(x,S)},n.set(a,f),a.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(s,"morphTexture",o.morphTexture,t);else{let d=0;for(let _=0;_<l.length;_++)d+=l[_];let m=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(s,"morphTargetBaseInfluence",m),c.getUniforms().setValue(s,"morphTargetInfluences",l)}c.getUniforms().setValue(s,"morphTargetsTexture",f.texture,t),c.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}return{update:r}}function Yx(s,e,t,n){let i=new WeakMap;function r(c){let l=n.render.frame,h=c.geometry,u=e.get(c,h);if(i.get(u)!==l&&(e.update(u),i.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),i.get(c)!==l&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){let f=c.skeleton;i.get(f)!==l&&(f.update(),i.set(f,l))}return u}function o(){i=new WeakMap}function a(c){let l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}var gp=new Et,Jf=new Wr(1,1),_p=new Pr,xp=new ga,yp=new Or,Qf=[],ep=[],tp=new Float32Array(16),np=new Float32Array(9),ip=new Float32Array(4);function lr(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Qf[i];if(r===void 0&&(r=new Float32Array(i),Qf[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function Lt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Dt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Dc(s,e){let t=ep[e];t===void 0&&(t=new Int32Array(e),ep[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function qx(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function $x(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;s.uniform2fv(this.addr,e),Dt(t,e)}}function Kx(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Lt(t,e))return;s.uniform3fv(this.addr,e),Dt(t,e)}}function jx(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;s.uniform4fv(this.addr,e),Dt(t,e)}}function Zx(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(Lt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,n))return;ip.set(n),s.uniformMatrix2fv(this.addr,!1,ip),Dt(t,n)}}function Jx(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(Lt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,n))return;np.set(n),s.uniformMatrix3fv(this.addr,!1,np),Dt(t,n)}}function Qx(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(Lt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,n))return;tp.set(n),s.uniformMatrix4fv(this.addr,!1,tp),Dt(t,n)}}function ey(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function ty(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;s.uniform2iv(this.addr,e),Dt(t,e)}}function ny(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Lt(t,e))return;s.uniform3iv(this.addr,e),Dt(t,e)}}function iy(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;s.uniform4iv(this.addr,e),Dt(t,e)}}function sy(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function ry(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;s.uniform2uiv(this.addr,e),Dt(t,e)}}function oy(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Lt(t,e))return;s.uniform3uiv(this.addr,e),Dt(t,e)}}function ay(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;s.uniform4uiv(this.addr,e),Dt(t,e)}}function cy(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Jf.compareFunction=ih,r=Jf):r=gp,t.setTexture2D(e||r,i)}function ly(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||xp,i)}function hy(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||yp,i)}function uy(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||_p,i)}function dy(s){switch(s){case 5126:return qx;case 35664:return $x;case 35665:return Kx;case 35666:return jx;case 35674:return Zx;case 35675:return Jx;case 35676:return Qx;case 5124:case 35670:return ey;case 35667:case 35671:return ty;case 35668:case 35672:return ny;case 35669:case 35673:return iy;case 5125:return sy;case 36294:return ry;case 36295:return oy;case 36296:return ay;case 35678:case 36198:case 36298:case 36306:case 35682:return cy;case 35679:case 36299:case 36307:return ly;case 35680:case 36300:case 36308:case 36293:return hy;case 36289:case 36303:case 36311:case 36292:return uy}}function fy(s,e){s.uniform1fv(this.addr,e)}function py(s,e){let t=lr(e,this.size,2);s.uniform2fv(this.addr,t)}function my(s,e){let t=lr(e,this.size,3);s.uniform3fv(this.addr,t)}function gy(s,e){let t=lr(e,this.size,4);s.uniform4fv(this.addr,t)}function _y(s,e){let t=lr(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function xy(s,e){let t=lr(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function yy(s,e){let t=lr(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function vy(s,e){s.uniform1iv(this.addr,e)}function My(s,e){s.uniform2iv(this.addr,e)}function by(s,e){s.uniform3iv(this.addr,e)}function Sy(s,e){s.uniform4iv(this.addr,e)}function wy(s,e){s.uniform1uiv(this.addr,e)}function Ty(s,e){s.uniform2uiv(this.addr,e)}function Ey(s,e){s.uniform3uiv(this.addr,e)}function Ay(s,e){s.uniform4uiv(this.addr,e)}function Ry(s,e,t){let n=this.cache,i=e.length,r=Dc(t,i);Lt(n,r)||(s.uniform1iv(this.addr,r),Dt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||gp,r[o])}function Cy(s,e,t){let n=this.cache,i=e.length,r=Dc(t,i);Lt(n,r)||(s.uniform1iv(this.addr,r),Dt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||xp,r[o])}function Iy(s,e,t){let n=this.cache,i=e.length,r=Dc(t,i);Lt(n,r)||(s.uniform1iv(this.addr,r),Dt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||yp,r[o])}function Py(s,e,t){let n=this.cache,i=e.length,r=Dc(t,i);Lt(n,r)||(s.uniform1iv(this.addr,r),Dt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||_p,r[o])}function Ly(s){switch(s){case 5126:return fy;case 35664:return py;case 35665:return my;case 35666:return gy;case 35674:return _y;case 35675:return xy;case 35676:return yy;case 5124:case 35670:return vy;case 35667:case 35671:return My;case 35668:case 35672:return by;case 35669:case 35673:return Sy;case 5125:return wy;case 36294:return Ty;case 36295:return Ey;case 36296:return Ay;case 35678:case 36198:case 36298:case 36306:case 35682:return Ry;case 35679:case 36299:case 36307:return Cy;case 35680:case 36300:case 36308:case 36293:return Iy;case 36289:case 36303:case 36311:case 36292:return Py}}var xh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=dy(t.type)}},yh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ly(t.type)}},vh=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,o=i.length;r!==o;++r){let a=i[r];a.setValue(e,t[a.id],n)}}},_h=/(\w+)(\])?(\[|\.)?/g;function sp(s,e){s.seq.push(e),s.map[e.id]=e}function Dy(s,e,t){let n=s.name,i=n.length;for(_h.lastIndex=0;;){let r=_h.exec(n),o=_h.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){sp(t,l===void 0?new xh(a,s,e):new yh(a,s,e));break}else{let u=t.map[a];u===void 0&&(u=new vh(a),sp(t,u)),t=u}}}var cr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);Dy(r,o,this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function rp(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var Ny=37297,Uy=0;function Oy(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var op=new Fe;function Fy(s){qe._getMatrix(op,qe.workingColorSpace,s);let e=`mat3( ${op.elements.map(t=>t.toFixed(4))} )`;switch(qe.getTransfer(s)){case Cr:return[e,"LinearTransferOETF"];case st:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function ap(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+Oy(s.getShaderSource(e),a)}else return r}function By(s,e){let t=Fy(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function ky(s,e){let t;switch(e){case xf:t="Linear";break;case yf:t="Reinhard";break;case vf:t="Cineon";break;case Wa:t="ACESFilmic";break;case bf:t="AgX";break;case Sf:t="Neutral";break;case Mf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ic=new R;function zy(){qe.getLuminanceCoefficients(Ic);let s=Ic.x.toFixed(4),e=Ic.y.toFixed(4),t=Ic.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Hy(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(yo).join(`
`)}function Vy(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Gy(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),o=r.name,a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function yo(s){return s!==""}function cp(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function lp(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Wy=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mh(s){return s.replace(Wy,Yy)}var Xy=new Map;function Yy(s,e){let t=Ve[e];if(t===void 0){let n=Xy.get(e);if(n!==void 0)t=Ve[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Mh(t)}var qy=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hp(s){return s.replace(qy,$y)}function $y(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function up(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Ky(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Gl?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===Oa?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Kn&&(e="SHADOWMAP_TYPE_VSM"),e}function jy(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case cs:case ls:e="ENVMAP_TYPE_CUBE";break;case fo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Zy(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case ls:e="ENVMAP_MODE_REFRACTION";break}return e}function Jy(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case Yl:e="ENVMAP_BLENDING_MULTIPLY";break;case gf:e="ENVMAP_BLENDING_MIX";break;case _f:e="ENVMAP_BLENDING_ADD";break}return e}function Qy(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function ev(s,e,t,n){let i=s.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=Ky(t),l=jy(t),h=Zy(t),u=Jy(t),f=Qy(t),d=Hy(t),m=Vy(r),_=i.createProgram(),g,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(yo).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(yo).join(`
`),p.length>0&&(p+=`
`)):(g=[up(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(yo).join(`
`),p=[up(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==gi?"#define TONE_MAPPING":"",t.toneMapping!==gi?Ve.tonemapping_pars_fragment:"",t.toneMapping!==gi?ky("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,By("linearToOutputTexel",t.outputColorSpace),zy(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(yo).join(`
`)),o=Mh(o),o=cp(o,t),o=lp(o,t),a=Mh(a),a=cp(a,t),a=lp(a,t),o=hp(o),a=hp(a),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===sh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===sh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let v=b+g+o,x=b+p+a,S=rp(i,i.VERTEX_SHADER,v),T=rp(i,i.FRAGMENT_SHADER,x);i.attachShader(_,S),i.attachShader(_,T),t.index0AttributeName!==void 0?i.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function C(P){if(s.debug.checkShaderErrors){let k=i.getProgramInfoLog(_)||"",z=i.getShaderInfoLog(S)||"",X=i.getShaderInfoLog(T)||"",G=k.trim(),Y=z.trim(),J=X.trim(),H=!0,ae=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(H=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,_,S,T);else{let ue=ap(i,S,"vertex"),Te=ap(i,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+G+`
`+ue+`
`+Te)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(Y===""||J==="")&&(ae=!1);ae&&(P.diagnostics={runnable:H,programLog:G,vertexShader:{log:Y,prefix:g},fragmentShader:{log:J,prefix:p}})}i.deleteShader(S),i.deleteShader(T),N=new cr(i,_),E=Gy(i,_)}let N;this.getUniforms=function(){return N===void 0&&C(this),N};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let w=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return w===!1&&(w=i.getProgramParameter(_,Ny)),w},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Uy++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=S,this.fragmentShader=T,this}var tv=0,bh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Sh(e),t.set(e,n)),n}},Sh=class{constructor(e){this.id=tv++,this.code=e,this.usedTimes=0}};function nv(s,e,t,n,i,r,o){let a=new Lr,c=new bh,l=new Set,h=[],u=i.logarithmicDepthBuffer,f=i.vertexTextures,d=i.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(E){return l.add(E),E===0?"uv":`uv${E}`}function g(E,w,P,k,z){let X=k.fog,G=z.geometry,Y=E.isMeshStandardMaterial?k.environment:null,J=(E.isMeshStandardMaterial?t:e).get(E.envMap||Y),H=J&&J.mapping===fo?J.image.height:null,ae=m[E.type];E.precision!==null&&(d=i.getMaxPrecision(E.precision),d!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",d,"instead."));let ue=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Te=ue!==void 0?ue.length:0,Ge=0;G.morphAttributes.position!==void 0&&(Ge=1),G.morphAttributes.normal!==void 0&&(Ge=2),G.morphAttributes.color!==void 0&&(Ge=3);let lt,mt,et,q;if(ae){let tt=jn[ae];lt=tt.vertexShader,mt=tt.fragmentShader}else lt=E.vertexShader,mt=E.fragmentShader,c.update(E),et=c.getVertexShaderID(E),q=c.getFragmentShaderID(E);let Z=s.getRenderTarget(),pe=s.state.buffers.depth.getReversed(),Ne=z.isInstancedMesh===!0,Se=z.isBatchedMesh===!0,$e=!!E.map,Gt=!!E.matcap,I=!!J,gt=!!E.aoMap,Oe=!!E.lightMap,Le=!!E.bumpMap,_e=!!E.normalMap,_t=!!E.displacementMap,xe=!!E.emissiveMap,He=!!E.metalnessMap,Ut=!!E.roughnessMap,St=E.anisotropy>0,A=E.clearcoat>0,y=E.dispersion>0,O=E.iridescence>0,W=E.sheen>0,j=E.transmission>0,V=St&&!!E.anisotropyMap,be=A&&!!E.clearcoatMap,ie=A&&!!E.clearcoatNormalMap,ye=A&&!!E.clearcoatRoughnessMap,ve=O&&!!E.iridescenceMap,te=O&&!!E.iridescenceThicknessMap,he=W&&!!E.sheenColorMap,Pe=W&&!!E.sheenRoughnessMap,Me=!!E.specularMap,ce=!!E.specularColorMap,Be=!!E.specularIntensityMap,L=j&&!!E.transmissionMap,ne=j&&!!E.thicknessMap,se=!!E.gradientMap,fe=!!E.alphaMap,Q=E.alphaTest>0,K=!!E.alphaHash,ge=!!E.extensions,Ue=gi;E.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(Ue=s.toneMapping);let ht={shaderID:ae,shaderType:E.type,shaderName:E.name,vertexShader:lt,fragmentShader:mt,defines:E.defines,customVertexShaderID:et,customFragmentShaderID:q,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:d,batching:Se,batchingColor:Se&&z._colorsTexture!==null,instancing:Ne,instancingColor:Ne&&z.instanceColor!==null,instancingMorph:Ne&&z.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Z===null?s.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Ht,alphaToCoverage:!!E.alphaToCoverage,map:$e,matcap:Gt,envMap:I,envMapMode:I&&J.mapping,envMapCubeUVHeight:H,aoMap:gt,lightMap:Oe,bumpMap:Le,normalMap:_e,displacementMap:f&&_t,emissiveMap:xe,normalMapObjectSpace:_e&&E.normalMapType===Rf,normalMapTangentSpace:_e&&E.normalMapType===nh,metalnessMap:He,roughnessMap:Ut,anisotropy:St,anisotropyMap:V,clearcoat:A,clearcoatMap:be,clearcoatNormalMap:ie,clearcoatRoughnessMap:ye,dispersion:y,iridescence:O,iridescenceMap:ve,iridescenceThicknessMap:te,sheen:W,sheenColorMap:he,sheenRoughnessMap:Pe,specularMap:Me,specularColorMap:ce,specularIntensityMap:Be,transmission:j,transmissionMap:L,thicknessMap:ne,gradientMap:se,opaque:E.transparent===!1&&E.blending===Qi&&E.alphaToCoverage===!1,alphaMap:fe,alphaTest:Q,alphaHash:K,combine:E.combine,mapUv:$e&&_(E.map.channel),aoMapUv:gt&&_(E.aoMap.channel),lightMapUv:Oe&&_(E.lightMap.channel),bumpMapUv:Le&&_(E.bumpMap.channel),normalMapUv:_e&&_(E.normalMap.channel),displacementMapUv:_t&&_(E.displacementMap.channel),emissiveMapUv:xe&&_(E.emissiveMap.channel),metalnessMapUv:He&&_(E.metalnessMap.channel),roughnessMapUv:Ut&&_(E.roughnessMap.channel),anisotropyMapUv:V&&_(E.anisotropyMap.channel),clearcoatMapUv:be&&_(E.clearcoatMap.channel),clearcoatNormalMapUv:ie&&_(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ye&&_(E.clearcoatRoughnessMap.channel),iridescenceMapUv:ve&&_(E.iridescenceMap.channel),iridescenceThicknessMapUv:te&&_(E.iridescenceThicknessMap.channel),sheenColorMapUv:he&&_(E.sheenColorMap.channel),sheenRoughnessMapUv:Pe&&_(E.sheenRoughnessMap.channel),specularMapUv:Me&&_(E.specularMap.channel),specularColorMapUv:ce&&_(E.specularColorMap.channel),specularIntensityMapUv:Be&&_(E.specularIntensityMap.channel),transmissionMapUv:L&&_(E.transmissionMap.channel),thicknessMapUv:ne&&_(E.thicknessMap.channel),alphaMapUv:fe&&_(E.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(_e||St),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!G.attributes.uv&&($e||fe),fog:!!X,useFog:E.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:pe,skinning:z.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:Ge,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:s.shadowMap.enabled&&P.length>0,shadowMapType:s.shadowMap.type,toneMapping:Ue,decodeVideoTexture:$e&&E.map.isVideoTexture===!0&&qe.getTransfer(E.map.colorSpace)===st,decodeVideoTextureEmissive:xe&&E.emissiveMap.isVideoTexture===!0&&qe.getTransfer(E.emissiveMap.colorSpace)===st,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===At,flipSided:E.side===en,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:ge&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ge&&E.extensions.multiDraw===!0||Se)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return ht.vertexUv1s=l.has(1),ht.vertexUv2s=l.has(2),ht.vertexUv3s=l.has(3),l.clear(),ht}function p(E){let w=[];if(E.shaderID?w.push(E.shaderID):(w.push(E.customVertexShaderID),w.push(E.customFragmentShaderID)),E.defines!==void 0)for(let P in E.defines)w.push(P),w.push(E.defines[P]);return E.isRawShaderMaterial===!1&&(b(w,E),v(w,E),w.push(s.outputColorSpace)),w.push(E.customProgramCacheKey),w.join()}function b(E,w){E.push(w.precision),E.push(w.outputColorSpace),E.push(w.envMapMode),E.push(w.envMapCubeUVHeight),E.push(w.mapUv),E.push(w.alphaMapUv),E.push(w.lightMapUv),E.push(w.aoMapUv),E.push(w.bumpMapUv),E.push(w.normalMapUv),E.push(w.displacementMapUv),E.push(w.emissiveMapUv),E.push(w.metalnessMapUv),E.push(w.roughnessMapUv),E.push(w.anisotropyMapUv),E.push(w.clearcoatMapUv),E.push(w.clearcoatNormalMapUv),E.push(w.clearcoatRoughnessMapUv),E.push(w.iridescenceMapUv),E.push(w.iridescenceThicknessMapUv),E.push(w.sheenColorMapUv),E.push(w.sheenRoughnessMapUv),E.push(w.specularMapUv),E.push(w.specularColorMapUv),E.push(w.specularIntensityMapUv),E.push(w.transmissionMapUv),E.push(w.thicknessMapUv),E.push(w.combine),E.push(w.fogExp2),E.push(w.sizeAttenuation),E.push(w.morphTargetsCount),E.push(w.morphAttributeCount),E.push(w.numDirLights),E.push(w.numPointLights),E.push(w.numSpotLights),E.push(w.numSpotLightMaps),E.push(w.numHemiLights),E.push(w.numRectAreaLights),E.push(w.numDirLightShadows),E.push(w.numPointLightShadows),E.push(w.numSpotLightShadows),E.push(w.numSpotLightShadowsWithMaps),E.push(w.numLightProbes),E.push(w.shadowMapType),E.push(w.toneMapping),E.push(w.numClippingPlanes),E.push(w.numClipIntersection),E.push(w.depthPacking)}function v(E,w){a.disableAll(),w.supportsVertexTextures&&a.enable(0),w.instancing&&a.enable(1),w.instancingColor&&a.enable(2),w.instancingMorph&&a.enable(3),w.matcap&&a.enable(4),w.envMap&&a.enable(5),w.normalMapObjectSpace&&a.enable(6),w.normalMapTangentSpace&&a.enable(7),w.clearcoat&&a.enable(8),w.iridescence&&a.enable(9),w.alphaTest&&a.enable(10),w.vertexColors&&a.enable(11),w.vertexAlphas&&a.enable(12),w.vertexUv1s&&a.enable(13),w.vertexUv2s&&a.enable(14),w.vertexUv3s&&a.enable(15),w.vertexTangents&&a.enable(16),w.anisotropy&&a.enable(17),w.alphaHash&&a.enable(18),w.batching&&a.enable(19),w.dispersion&&a.enable(20),w.batchingColor&&a.enable(21),w.gradientMap&&a.enable(22),E.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),E.push(a.mask)}function x(E){let w=m[E.type],P;if(w){let k=jn[w];P=kf.clone(k.uniforms)}else P=E.uniforms;return P}function S(E,w){let P;for(let k=0,z=h.length;k<z;k++){let X=h[k];if(X.cacheKey===w){P=X,++P.usedTimes;break}}return P===void 0&&(P=new ev(s,w,E,r),h.push(P)),P}function T(E){if(--E.usedTimes===0){let w=h.indexOf(E);h[w]=h[h.length-1],h.pop(),E.destroy()}}function C(E){c.remove(E)}function N(){c.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:x,acquireProgram:S,releaseProgram:T,releaseShaderCache:C,programs:h,dispose:N}}function iv(){let s=new WeakMap;function e(o){return s.has(o)}function t(o){let a=s.get(o);return a===void 0&&(a={},s.set(o,a)),a}function n(o){s.delete(o)}function i(o,a,c){s.get(o)[a]=c}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function sv(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function dp(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function fp(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(u,f,d,m,_,g){let p=s[e];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:m,renderOrder:u.renderOrder,z:_,group:g},s[e]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=m,p.renderOrder=u.renderOrder,p.z=_,p.group=g),e++,p}function a(u,f,d,m,_,g){let p=o(u,f,d,m,_,g);d.transmission>0?n.push(p):d.transparent===!0?i.push(p):t.push(p)}function c(u,f,d,m,_,g){let p=o(u,f,d,m,_,g);d.transmission>0?n.unshift(p):d.transparent===!0?i.unshift(p):t.unshift(p)}function l(u,f){t.length>1&&t.sort(u||sv),n.length>1&&n.sort(f||dp),i.length>1&&i.sort(f||dp)}function h(){for(let u=e,f=s.length;u<f;u++){let d=s[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:h,sort:l}}function rv(){let s=new WeakMap;function e(n,i){let r=s.get(n),o;return r===void 0?(o=new fp,s.set(n,[o])):i>=r.length?(o=new fp,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function ov(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new R,color:new we};break;case"SpotLight":t={position:new R,direction:new R,color:new we,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new we,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new we,groundColor:new we};break;case"RectAreaLight":t={color:new we,position:new R,halfWidth:new R,halfHeight:new R};break}return s[e.id]=t,t}}}function av(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var cv=0;function lv(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function hv(s){let e=new ov,t=av(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new R);let i=new R,r=new Ce,o=new Ce;function a(l){let h=0,u=0,f=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let d=0,m=0,_=0,g=0,p=0,b=0,v=0,x=0,S=0,T=0,C=0;l.sort(lv);for(let E=0,w=l.length;E<w;E++){let P=l[E],k=P.color,z=P.intensity,X=P.distance,G=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=k.r*z,u+=k.g*z,f+=k.b*z;else if(P.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(P.sh.coefficients[Y],z);C++}else if(P.isDirectionalLight){let Y=e.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let J=P.shadow,H=t.get(P);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,n.directionalShadow[d]=H,n.directionalShadowMap[d]=G,n.directionalShadowMatrix[d]=P.shadow.matrix,b++}n.directional[d]=Y,d++}else if(P.isSpotLight){let Y=e.get(P);Y.position.setFromMatrixPosition(P.matrixWorld),Y.color.copy(k).multiplyScalar(z),Y.distance=X,Y.coneCos=Math.cos(P.angle),Y.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),Y.decay=P.decay,n.spot[_]=Y;let J=P.shadow;if(P.map&&(n.spotLightMap[S]=P.map,S++,J.updateMatrices(P),P.castShadow&&T++),n.spotLightMatrix[_]=J.matrix,P.castShadow){let H=t.get(P);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,n.spotShadow[_]=H,n.spotShadowMap[_]=G,x++}_++}else if(P.isRectAreaLight){let Y=e.get(P);Y.color.copy(k).multiplyScalar(z),Y.halfWidth.set(P.width*.5,0,0),Y.halfHeight.set(0,P.height*.5,0),n.rectArea[g]=Y,g++}else if(P.isPointLight){let Y=e.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity),Y.distance=P.distance,Y.decay=P.decay,P.castShadow){let J=P.shadow,H=t.get(P);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,H.shadowCameraNear=J.camera.near,H.shadowCameraFar=J.camera.far,n.pointShadow[m]=H,n.pointShadowMap[m]=G,n.pointShadowMatrix[m]=P.shadow.matrix,v++}n.point[m]=Y,m++}else if(P.isHemisphereLight){let Y=e.get(P);Y.skyColor.copy(P.color).multiplyScalar(z),Y.groundColor.copy(P.groundColor).multiplyScalar(z),n.hemi[p]=Y,p++}}g>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=oe.LTC_FLOAT_1,n.rectAreaLTC2=oe.LTC_FLOAT_2):(n.rectAreaLTC1=oe.LTC_HALF_1,n.rectAreaLTC2=oe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let N=n.hash;(N.directionalLength!==d||N.pointLength!==m||N.spotLength!==_||N.rectAreaLength!==g||N.hemiLength!==p||N.numDirectionalShadows!==b||N.numPointShadows!==v||N.numSpotShadows!==x||N.numSpotMaps!==S||N.numLightProbes!==C)&&(n.directional.length=d,n.spot.length=_,n.rectArea.length=g,n.point.length=m,n.hemi.length=p,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=x+S-T,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=C,N.directionalLength=d,N.pointLength=m,N.spotLength=_,N.rectAreaLength=g,N.hemiLength=p,N.numDirectionalShadows=b,N.numPointShadows=v,N.numSpotShadows=x,N.numSpotMaps=S,N.numLightProbes=C,n.version=cv++)}function c(l,h){let u=0,f=0,d=0,m=0,_=0,g=h.matrixWorldInverse;for(let p=0,b=l.length;p<b;p++){let v=l[p];if(v.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(v.matrixWorld),i.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(g),u++}else if(v.isSpotLight){let x=n.spot[d];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(v.matrixWorld),i.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(g),d++}else if(v.isRectAreaLight){let x=n.rectArea[m];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),o.identity(),r.copy(v.matrixWorld),r.premultiply(g),o.extractRotation(r),x.halfWidth.set(v.width*.5,0,0),x.halfHeight.set(0,v.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),m++}else if(v.isPointLight){let x=n.point[f];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),f++}else if(v.isHemisphereLight){let x=n.hemi[_];x.direction.setFromMatrixPosition(v.matrixWorld),x.direction.transformDirection(g),_++}}}return{setup:a,setupView:c,state:n}}function pp(s){let e=new hv(s),t=[],n=[];function i(h){l.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function o(h){n.push(h)}function a(){e.setup(t)}function c(h){e.setupView(t,h)}let l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function uv(s){let e=new WeakMap;function t(i,r=0){let o=e.get(i),a;return o===void 0?(a=new pp(s),e.set(i,[a])):r>=o.length?(a=new pp(s),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var dv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function pv(s,e,t){let n=new qs,i=new re,r=new re,o=new Je,a=new Aa({depthPacking:Af}),c=new Ra,l={},h=t.maxTextureSize,u={[Ln]:en,[en]:Ln,[At]:At},f=new Un({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new re},radius:{value:4}},vertexShader:dv,fragmentShader:fv}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let m=new Pt;m.setAttribute("position",new Ke(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new pt(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Gl;let p=this.type;this.render=function(T,C,N){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||T.length===0)return;let E=s.getRenderTarget(),w=s.getActiveCubeFace(),P=s.getActiveMipmapLevel(),k=s.state;k.setBlending(mi),k.buffers.depth.getReversed()===!0?k.buffers.color.setClear(0,0,0,0):k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);let z=p!==Kn&&this.type===Kn,X=p===Kn&&this.type!==Kn;for(let G=0,Y=T.length;G<Y;G++){let J=T[G],H=J.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;i.copy(H.mapSize);let ae=H.getFrameExtents();if(i.multiply(ae),r.copy(H.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/ae.x),i.x=r.x*ae.x,H.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/ae.y),i.y=r.y*ae.y,H.mapSize.y=r.y)),H.map===null||z===!0||X===!0){let Te=this.type!==Kn?{minFilter:It,magFilter:It}:{};H.map!==null&&H.map.dispose(),H.map=new Wn(i.x,i.y,Te),H.map.texture.name=J.name+".shadowMap",H.camera.updateProjectionMatrix()}s.setRenderTarget(H.map),s.clear();let ue=H.getViewportCount();for(let Te=0;Te<ue;Te++){let Ge=H.getViewport(Te);o.set(r.x*Ge.x,r.y*Ge.y,r.x*Ge.z,r.y*Ge.w),k.viewport(o),H.updateMatrices(J,Te),n=H.getFrustum(),x(C,N,H.camera,J,this.type)}H.isPointLightShadow!==!0&&this.type===Kn&&b(H,N),H.needsUpdate=!1}p=this.type,g.needsUpdate=!1,s.setRenderTarget(E,w,P)};function b(T,C){let N=e.update(_);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Wn(i.x,i.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,s.setRenderTarget(T.mapPass),s.clear(),s.renderBufferDirect(C,null,N,f,_,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,s.setRenderTarget(T.map),s.clear(),s.renderBufferDirect(C,null,N,d,_,null)}function v(T,C,N,E){let w=null,P=N.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(P!==void 0)w=P;else if(w=N.isPointLight===!0?c:a,s.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let k=w.uuid,z=C.uuid,X=l[k];X===void 0&&(X={},l[k]=X);let G=X[z];G===void 0&&(G=w.clone(),X[z]=G,C.addEventListener("dispose",S)),w=G}if(w.visible=C.visible,w.wireframe=C.wireframe,E===Kn?w.side=C.shadowSide!==null?C.shadowSide:C.side:w.side=C.shadowSide!==null?C.shadowSide:u[C.side],w.alphaMap=C.alphaMap,w.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,w.map=C.map,w.clipShadows=C.clipShadows,w.clippingPlanes=C.clippingPlanes,w.clipIntersection=C.clipIntersection,w.displacementMap=C.displacementMap,w.displacementScale=C.displacementScale,w.displacementBias=C.displacementBias,w.wireframeLinewidth=C.wireframeLinewidth,w.linewidth=C.linewidth,N.isPointLight===!0&&w.isMeshDistanceMaterial===!0){let k=s.properties.get(w);k.light=N}return w}function x(T,C,N,E,w){if(T.visible===!1)return;if(T.layers.test(C.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&w===Kn)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,T.matrixWorld);let z=e.update(T),X=T.material;if(Array.isArray(X)){let G=z.groups;for(let Y=0,J=G.length;Y<J;Y++){let H=G[Y],ae=X[H.materialIndex];if(ae&&ae.visible){let ue=v(T,ae,E,w);T.onBeforeShadow(s,T,C,N,z,ue,H),s.renderBufferDirect(N,null,z,ue,T,H),T.onAfterShadow(s,T,C,N,z,ue,H)}}}else if(X.visible){let G=v(T,X,E,w);T.onBeforeShadow(s,T,C,N,z,G,null),s.renderBufferDirect(N,null,z,G,T,null),T.onAfterShadow(s,T,C,N,z,G,null)}}let k=T.children;for(let z=0,X=k.length;z<X;z++)x(k[z],C,N,E,w)}function S(T){T.target.removeEventListener("dispose",S);for(let N in l){let E=l[N],w=T.target.uuid;w in E&&(E[w].dispose(),delete E[w])}}}var mv={[Fa]:Ba,[ka]:Va,[za]:Ga,[es]:Ha,[Ba]:Fa,[Va]:ka,[Ga]:za,[Ha]:es};function gv(s,e){function t(){let L=!1,ne=new Je,se=null,fe=new Je(0,0,0,0);return{setMask:function(Q){se!==Q&&!L&&(s.colorMask(Q,Q,Q,Q),se=Q)},setLocked:function(Q){L=Q},setClear:function(Q,K,ge,Ue,ht){ht===!0&&(Q*=Ue,K*=Ue,ge*=Ue),ne.set(Q,K,ge,Ue),fe.equals(ne)===!1&&(s.clearColor(Q,K,ge,Ue),fe.copy(ne))},reset:function(){L=!1,se=null,fe.set(-1,0,0,0)}}}function n(){let L=!1,ne=!1,se=null,fe=null,Q=null;return{setReversed:function(K){if(ne!==K){let ge=e.get("EXT_clip_control");K?ge.clipControlEXT(ge.LOWER_LEFT_EXT,ge.ZERO_TO_ONE_EXT):ge.clipControlEXT(ge.LOWER_LEFT_EXT,ge.NEGATIVE_ONE_TO_ONE_EXT),ne=K;let Ue=Q;Q=null,this.setClear(Ue)}},getReversed:function(){return ne},setTest:function(K){K?Z(s.DEPTH_TEST):pe(s.DEPTH_TEST)},setMask:function(K){se!==K&&!L&&(s.depthMask(K),se=K)},setFunc:function(K){if(ne&&(K=mv[K]),fe!==K){switch(K){case Fa:s.depthFunc(s.NEVER);break;case Ba:s.depthFunc(s.ALWAYS);break;case ka:s.depthFunc(s.LESS);break;case es:s.depthFunc(s.LEQUAL);break;case za:s.depthFunc(s.EQUAL);break;case Ha:s.depthFunc(s.GEQUAL);break;case Va:s.depthFunc(s.GREATER);break;case Ga:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}fe=K}},setLocked:function(K){L=K},setClear:function(K){Q!==K&&(ne&&(K=1-K),s.clearDepth(K),Q=K)},reset:function(){L=!1,se=null,fe=null,Q=null,ne=!1}}}function i(){let L=!1,ne=null,se=null,fe=null,Q=null,K=null,ge=null,Ue=null,ht=null;return{setTest:function(tt){L||(tt?Z(s.STENCIL_TEST):pe(s.STENCIL_TEST))},setMask:function(tt){ne!==tt&&!L&&(s.stencilMask(tt),ne=tt)},setFunc:function(tt,Jn,kn){(se!==tt||fe!==Jn||Q!==kn)&&(s.stencilFunc(tt,Jn,kn),se=tt,fe=Jn,Q=kn)},setOp:function(tt,Jn,kn){(K!==tt||ge!==Jn||Ue!==kn)&&(s.stencilOp(tt,Jn,kn),K=tt,ge=Jn,Ue=kn)},setLocked:function(tt){L=tt},setClear:function(tt){ht!==tt&&(s.clearStencil(tt),ht=tt)},reset:function(){L=!1,ne=null,se=null,fe=null,Q=null,K=null,ge=null,Ue=null,ht=null}}}let r=new t,o=new n,a=new i,c=new WeakMap,l=new WeakMap,h={},u={},f=new WeakMap,d=[],m=null,_=!1,g=null,p=null,b=null,v=null,x=null,S=null,T=null,C=new we(0,0,0),N=0,E=!1,w=null,P=null,k=null,z=null,X=null,G=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,J=0,H=s.getParameter(s.VERSION);H.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(H)[1]),Y=J>=1):H.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),Y=J>=2);let ae=null,ue={},Te=s.getParameter(s.SCISSOR_BOX),Ge=s.getParameter(s.VIEWPORT),lt=new Je().fromArray(Te),mt=new Je().fromArray(Ge);function et(L,ne,se,fe){let Q=new Uint8Array(4),K=s.createTexture();s.bindTexture(L,K),s.texParameteri(L,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(L,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let ge=0;ge<se;ge++)L===s.TEXTURE_3D||L===s.TEXTURE_2D_ARRAY?s.texImage3D(ne,0,s.RGBA,1,1,fe,0,s.RGBA,s.UNSIGNED_BYTE,Q):s.texImage2D(ne+ge,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,Q);return K}let q={};q[s.TEXTURE_2D]=et(s.TEXTURE_2D,s.TEXTURE_2D,1),q[s.TEXTURE_CUBE_MAP]=et(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[s.TEXTURE_2D_ARRAY]=et(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),q[s.TEXTURE_3D]=et(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Z(s.DEPTH_TEST),o.setFunc(es),Le(!1),_e(Vl),Z(s.CULL_FACE),gt(mi);function Z(L){h[L]!==!0&&(s.enable(L),h[L]=!0)}function pe(L){h[L]!==!1&&(s.disable(L),h[L]=!1)}function Ne(L,ne){return u[L]!==ne?(s.bindFramebuffer(L,ne),u[L]=ne,L===s.DRAW_FRAMEBUFFER&&(u[s.FRAMEBUFFER]=ne),L===s.FRAMEBUFFER&&(u[s.DRAW_FRAMEBUFFER]=ne),!0):!1}function Se(L,ne){let se=d,fe=!1;if(L){se=f.get(ne),se===void 0&&(se=[],f.set(ne,se));let Q=L.textures;if(se.length!==Q.length||se[0]!==s.COLOR_ATTACHMENT0){for(let K=0,ge=Q.length;K<ge;K++)se[K]=s.COLOR_ATTACHMENT0+K;se.length=Q.length,fe=!0}}else se[0]!==s.BACK&&(se[0]=s.BACK,fe=!0);fe&&s.drawBuffers(se)}function $e(L){return m!==L?(s.useProgram(L),m=L,!0):!1}let Gt={[Ci]:s.FUNC_ADD,[Jd]:s.FUNC_SUBTRACT,[Qd]:s.FUNC_REVERSE_SUBTRACT};Gt[ef]=s.MIN,Gt[tf]=s.MAX;let I={[nf]:s.ZERO,[sf]:s.ONE,[rf]:s.SRC_COLOR,[da]:s.SRC_ALPHA,[uf]:s.SRC_ALPHA_SATURATE,[lf]:s.DST_COLOR,[af]:s.DST_ALPHA,[of]:s.ONE_MINUS_SRC_COLOR,[fa]:s.ONE_MINUS_SRC_ALPHA,[hf]:s.ONE_MINUS_DST_COLOR,[cf]:s.ONE_MINUS_DST_ALPHA,[df]:s.CONSTANT_COLOR,[ff]:s.ONE_MINUS_CONSTANT_COLOR,[pf]:s.CONSTANT_ALPHA,[mf]:s.ONE_MINUS_CONSTANT_ALPHA};function gt(L,ne,se,fe,Q,K,ge,Ue,ht,tt){if(L===mi){_===!0&&(pe(s.BLEND),_=!1);return}if(_===!1&&(Z(s.BLEND),_=!0),L!==Zd){if(L!==g||tt!==E){if((p!==Ci||x!==Ci)&&(s.blendEquation(s.FUNC_ADD),p=Ci,x=Ci),tt)switch(L){case Qi:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case uo:s.blendFunc(s.ONE,s.ONE);break;case Wl:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Xl:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case Qi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case uo:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Wl:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Xl:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}b=null,v=null,S=null,T=null,C.set(0,0,0),N=0,g=L,E=tt}return}Q=Q||ne,K=K||se,ge=ge||fe,(ne!==p||Q!==x)&&(s.blendEquationSeparate(Gt[ne],Gt[Q]),p=ne,x=Q),(se!==b||fe!==v||K!==S||ge!==T)&&(s.blendFuncSeparate(I[se],I[fe],I[K],I[ge]),b=se,v=fe,S=K,T=ge),(Ue.equals(C)===!1||ht!==N)&&(s.blendColor(Ue.r,Ue.g,Ue.b,ht),C.copy(Ue),N=ht),g=L,E=!1}function Oe(L,ne){L.side===At?pe(s.CULL_FACE):Z(s.CULL_FACE);let se=L.side===en;ne&&(se=!se),Le(se),L.blending===Qi&&L.transparent===!1?gt(mi):gt(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),o.setFunc(L.depthFunc),o.setTest(L.depthTest),o.setMask(L.depthWrite),r.setMask(L.colorWrite);let fe=L.stencilWrite;a.setTest(fe),fe&&(a.setMask(L.stencilWriteMask),a.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),a.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),xe(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?Z(s.SAMPLE_ALPHA_TO_COVERAGE):pe(s.SAMPLE_ALPHA_TO_COVERAGE)}function Le(L){w!==L&&(L?s.frontFace(s.CW):s.frontFace(s.CCW),w=L)}function _e(L){L!==Kd?(Z(s.CULL_FACE),L!==P&&(L===Vl?s.cullFace(s.BACK):L===jd?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):pe(s.CULL_FACE),P=L}function _t(L){L!==k&&(Y&&s.lineWidth(L),k=L)}function xe(L,ne,se){L?(Z(s.POLYGON_OFFSET_FILL),(z!==ne||X!==se)&&(s.polygonOffset(ne,se),z=ne,X=se)):pe(s.POLYGON_OFFSET_FILL)}function He(L){L?Z(s.SCISSOR_TEST):pe(s.SCISSOR_TEST)}function Ut(L){L===void 0&&(L=s.TEXTURE0+G-1),ae!==L&&(s.activeTexture(L),ae=L)}function St(L,ne,se){se===void 0&&(ae===null?se=s.TEXTURE0+G-1:se=ae);let fe=ue[se];fe===void 0&&(fe={type:void 0,texture:void 0},ue[se]=fe),(fe.type!==L||fe.texture!==ne)&&(ae!==se&&(s.activeTexture(se),ae=se),s.bindTexture(L,ne||q[L]),fe.type=L,fe.texture=ne)}function A(){let L=ue[ae];L!==void 0&&L.type!==void 0&&(s.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function y(){try{s.compressedTexImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function O(){try{s.compressedTexImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function W(){try{s.texSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function j(){try{s.texSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function V(){try{s.compressedTexSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function be(){try{s.compressedTexSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ie(){try{s.texStorage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ye(){try{s.texStorage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ve(){try{s.texImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function te(){try{s.texImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function he(L){lt.equals(L)===!1&&(s.scissor(L.x,L.y,L.z,L.w),lt.copy(L))}function Pe(L){mt.equals(L)===!1&&(s.viewport(L.x,L.y,L.z,L.w),mt.copy(L))}function Me(L,ne){let se=l.get(ne);se===void 0&&(se=new WeakMap,l.set(ne,se));let fe=se.get(L);fe===void 0&&(fe=s.getUniformBlockIndex(ne,L.name),se.set(L,fe))}function ce(L,ne){let fe=l.get(ne).get(L);c.get(ne)!==fe&&(s.uniformBlockBinding(ne,fe,L.__bindingPointIndex),c.set(ne,fe))}function Be(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),o.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),h={},ae=null,ue={},u={},f=new WeakMap,d=[],m=null,_=!1,g=null,p=null,b=null,v=null,x=null,S=null,T=null,C=new we(0,0,0),N=0,E=!1,w=null,P=null,k=null,z=null,X=null,lt.set(0,0,s.canvas.width,s.canvas.height),mt.set(0,0,s.canvas.width,s.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:Z,disable:pe,bindFramebuffer:Ne,drawBuffers:Se,useProgram:$e,setBlending:gt,setMaterial:Oe,setFlipSided:Le,setCullFace:_e,setLineWidth:_t,setPolygonOffset:xe,setScissorTest:He,activeTexture:Ut,bindTexture:St,unbindTexture:A,compressedTexImage2D:y,compressedTexImage3D:O,texImage2D:ve,texImage3D:te,updateUBOMapping:Me,uniformBlockBinding:ce,texStorage2D:ie,texStorage3D:ye,texSubImage2D:W,texSubImage3D:j,compressedTexSubImage2D:V,compressedTexSubImage3D:be,scissor:he,viewport:Pe,reset:Be}}function _v(s,e,t,n,i,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new re,h=new WeakMap,u,f=new WeakMap,d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(A,y){return d?new OffscreenCanvas(A,y):zs("canvas")}function _(A,y,O){let W=1,j=St(A);if((j.width>O||j.height>O)&&(W=O/Math.max(j.width,j.height)),W<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let V=Math.floor(W*j.width),be=Math.floor(W*j.height);u===void 0&&(u=m(V,be));let ie=y?m(V,be):u;return ie.width=V,ie.height=be,ie.getContext("2d").drawImage(A,0,0,V,be),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+V+"x"+be+")."),ie}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),A;return A}function g(A){return A.generateMipmaps}function p(A){s.generateMipmap(A)}function b(A){return A.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?s.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function v(A,y,O,W,j=!1){if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let V=y;if(y===s.RED&&(O===s.FLOAT&&(V=s.R32F),O===s.HALF_FLOAT&&(V=s.R16F),O===s.UNSIGNED_BYTE&&(V=s.R8)),y===s.RED_INTEGER&&(O===s.UNSIGNED_BYTE&&(V=s.R8UI),O===s.UNSIGNED_SHORT&&(V=s.R16UI),O===s.UNSIGNED_INT&&(V=s.R32UI),O===s.BYTE&&(V=s.R8I),O===s.SHORT&&(V=s.R16I),O===s.INT&&(V=s.R32I)),y===s.RG&&(O===s.FLOAT&&(V=s.RG32F),O===s.HALF_FLOAT&&(V=s.RG16F),O===s.UNSIGNED_BYTE&&(V=s.RG8)),y===s.RG_INTEGER&&(O===s.UNSIGNED_BYTE&&(V=s.RG8UI),O===s.UNSIGNED_SHORT&&(V=s.RG16UI),O===s.UNSIGNED_INT&&(V=s.RG32UI),O===s.BYTE&&(V=s.RG8I),O===s.SHORT&&(V=s.RG16I),O===s.INT&&(V=s.RG32I)),y===s.RGB_INTEGER&&(O===s.UNSIGNED_BYTE&&(V=s.RGB8UI),O===s.UNSIGNED_SHORT&&(V=s.RGB16UI),O===s.UNSIGNED_INT&&(V=s.RGB32UI),O===s.BYTE&&(V=s.RGB8I),O===s.SHORT&&(V=s.RGB16I),O===s.INT&&(V=s.RGB32I)),y===s.RGBA_INTEGER&&(O===s.UNSIGNED_BYTE&&(V=s.RGBA8UI),O===s.UNSIGNED_SHORT&&(V=s.RGBA16UI),O===s.UNSIGNED_INT&&(V=s.RGBA32UI),O===s.BYTE&&(V=s.RGBA8I),O===s.SHORT&&(V=s.RGBA16I),O===s.INT&&(V=s.RGBA32I)),y===s.RGB&&(O===s.UNSIGNED_INT_5_9_9_9_REV&&(V=s.RGB9_E5),O===s.UNSIGNED_INT_10F_11F_11F_REV&&(V=s.R11F_G11F_B10F)),y===s.RGBA){let be=j?Cr:qe.getTransfer(W);O===s.FLOAT&&(V=s.RGBA32F),O===s.HALF_FLOAT&&(V=s.RGBA16F),O===s.UNSIGNED_BYTE&&(V=be===st?s.SRGB8_ALPHA8:s.RGBA8),O===s.UNSIGNED_SHORT_4_4_4_4&&(V=s.RGBA4),O===s.UNSIGNED_SHORT_5_5_5_1&&(V=s.RGB5_A1)}return(V===s.R16F||V===s.R32F||V===s.RG16F||V===s.RG32F||V===s.RGBA16F||V===s.RGBA32F)&&e.get("EXT_color_buffer_float"),V}function x(A,y){let O;return A?y===null||y===ki||y===ir?O=s.DEPTH24_STENCIL8:y===wn?O=s.DEPTH32F_STENCIL8:y===tr&&(O=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===ki||y===ir?O=s.DEPTH_COMPONENT24:y===wn?O=s.DEPTH_COMPONENT32F:y===tr&&(O=s.DEPTH_COMPONENT16),O}function S(A,y){return g(A)===!0||A.isFramebufferTexture&&A.minFilter!==It&&A.minFilter!==zt?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function T(A){let y=A.target;y.removeEventListener("dispose",T),N(y),y.isVideoTexture&&h.delete(y)}function C(A){let y=A.target;y.removeEventListener("dispose",C),w(y)}function N(A){let y=n.get(A);if(y.__webglInit===void 0)return;let O=A.source,W=f.get(O);if(W){let j=W[y.__cacheKey];j.usedTimes--,j.usedTimes===0&&E(A),Object.keys(W).length===0&&f.delete(O)}n.remove(A)}function E(A){let y=n.get(A);s.deleteTexture(y.__webglTexture);let O=A.source,W=f.get(O);delete W[y.__cacheKey],o.memory.textures--}function w(A){let y=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(y.__webglFramebuffer[W]))for(let j=0;j<y.__webglFramebuffer[W].length;j++)s.deleteFramebuffer(y.__webglFramebuffer[W][j]);else s.deleteFramebuffer(y.__webglFramebuffer[W]);y.__webglDepthbuffer&&s.deleteRenderbuffer(y.__webglDepthbuffer[W])}else{if(Array.isArray(y.__webglFramebuffer))for(let W=0;W<y.__webglFramebuffer.length;W++)s.deleteFramebuffer(y.__webglFramebuffer[W]);else s.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&s.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&s.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let W=0;W<y.__webglColorRenderbuffer.length;W++)y.__webglColorRenderbuffer[W]&&s.deleteRenderbuffer(y.__webglColorRenderbuffer[W]);y.__webglDepthRenderbuffer&&s.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let O=A.textures;for(let W=0,j=O.length;W<j;W++){let V=n.get(O[W]);V.__webglTexture&&(s.deleteTexture(V.__webglTexture),o.memory.textures--),n.remove(O[W])}n.remove(A)}let P=0;function k(){P=0}function z(){let A=P;return A>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+i.maxTextures),P+=1,A}function X(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function G(A,y){let O=n.get(A);if(A.isVideoTexture&&He(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&O.__version!==A.version){let W=A.image;if(W===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(O,A,y);return}}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,O.__webglTexture,s.TEXTURE0+y)}function Y(A,y){let O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){q(O,A,y);return}t.bindTexture(s.TEXTURE_2D_ARRAY,O.__webglTexture,s.TEXTURE0+y)}function J(A,y){let O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){q(O,A,y);return}t.bindTexture(s.TEXTURE_3D,O.__webglTexture,s.TEXTURE0+y)}function H(A,y){let O=n.get(A);if(A.version>0&&O.__version!==A.version){Z(O,A,y);return}t.bindTexture(s.TEXTURE_CUBE_MAP,O.__webglTexture,s.TEXTURE0+y)}let ae={[Vn]:s.REPEAT,[bn]:s.CLAMP_TO_EDGE,[Ii]:s.MIRRORED_REPEAT},ue={[It]:s.NEAREST,[er]:s.NEAREST_MIPMAP_NEAREST,[_i]:s.NEAREST_MIPMAP_LINEAR,[zt]:s.LINEAR,[Bi]:s.LINEAR_MIPMAP_NEAREST,[_n]:s.LINEAR_MIPMAP_LINEAR},Te={[Cf]:s.NEVER,[Uf]:s.ALWAYS,[If]:s.LESS,[ih]:s.LEQUAL,[Pf]:s.EQUAL,[Nf]:s.GEQUAL,[Lf]:s.GREATER,[Df]:s.NOTEQUAL};function Ge(A,y){if(y.type===wn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===zt||y.magFilter===Bi||y.magFilter===_i||y.magFilter===_n||y.minFilter===zt||y.minFilter===Bi||y.minFilter===_i||y.minFilter===_n)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(A,s.TEXTURE_WRAP_S,ae[y.wrapS]),s.texParameteri(A,s.TEXTURE_WRAP_T,ae[y.wrapT]),(A===s.TEXTURE_3D||A===s.TEXTURE_2D_ARRAY)&&s.texParameteri(A,s.TEXTURE_WRAP_R,ae[y.wrapR]),s.texParameteri(A,s.TEXTURE_MAG_FILTER,ue[y.magFilter]),s.texParameteri(A,s.TEXTURE_MIN_FILTER,ue[y.minFilter]),y.compareFunction&&(s.texParameteri(A,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(A,s.TEXTURE_COMPARE_FUNC,Te[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===It||y.minFilter!==_i&&y.minFilter!==_n||y.type===wn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");s.texParameterf(A,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,i.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function lt(A,y){let O=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",T));let W=y.source,j=f.get(W);j===void 0&&(j={},f.set(W,j));let V=X(y);if(V!==A.__cacheKey){j[V]===void 0&&(j[V]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,O=!0),j[V].usedTimes++;let be=j[A.__cacheKey];be!==void 0&&(j[A.__cacheKey].usedTimes--,be.usedTimes===0&&E(y)),A.__cacheKey=V,A.__webglTexture=j[V].texture}return O}function mt(A,y,O){return Math.floor(Math.floor(A/O)/y)}function et(A,y,O,W){let V=A.updateRanges;if(V.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,y.width,y.height,O,W,y.data);else{V.sort((te,he)=>te.start-he.start);let be=0;for(let te=1;te<V.length;te++){let he=V[be],Pe=V[te],Me=he.start+he.count,ce=mt(Pe.start,y.width,4),Be=mt(he.start,y.width,4);Pe.start<=Me+1&&ce===Be&&mt(Pe.start+Pe.count-1,y.width,4)===ce?he.count=Math.max(he.count,Pe.start+Pe.count-he.start):(++be,V[be]=Pe)}V.length=be+1;let ie=s.getParameter(s.UNPACK_ROW_LENGTH),ye=s.getParameter(s.UNPACK_SKIP_PIXELS),ve=s.getParameter(s.UNPACK_SKIP_ROWS);s.pixelStorei(s.UNPACK_ROW_LENGTH,y.width);for(let te=0,he=V.length;te<he;te++){let Pe=V[te],Me=Math.floor(Pe.start/4),ce=Math.ceil(Pe.count/4),Be=Me%y.width,L=Math.floor(Me/y.width),ne=ce,se=1;s.pixelStorei(s.UNPACK_SKIP_PIXELS,Be),s.pixelStorei(s.UNPACK_SKIP_ROWS,L),t.texSubImage2D(s.TEXTURE_2D,0,Be,L,ne,se,O,W,y.data)}A.clearUpdateRanges(),s.pixelStorei(s.UNPACK_ROW_LENGTH,ie),s.pixelStorei(s.UNPACK_SKIP_PIXELS,ye),s.pixelStorei(s.UNPACK_SKIP_ROWS,ve)}}function q(A,y,O){let W=s.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(W=s.TEXTURE_2D_ARRAY),y.isData3DTexture&&(W=s.TEXTURE_3D);let j=lt(A,y),V=y.source;t.bindTexture(W,A.__webglTexture,s.TEXTURE0+O);let be=n.get(V);if(V.version!==be.__version||j===!0){t.activeTexture(s.TEXTURE0+O);let ie=qe.getPrimaries(qe.workingColorSpace),ye=y.colorSpace===Bn?null:qe.getPrimaries(y.colorSpace),ve=y.colorSpace===Bn||ie===ye?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,ve);let te=_(y.image,!1,i.maxTextureSize);te=Ut(y,te);let he=r.convert(y.format,y.colorSpace),Pe=r.convert(y.type),Me=v(y.internalFormat,he,Pe,y.colorSpace,y.isVideoTexture);Ge(W,y);let ce,Be=y.mipmaps,L=y.isVideoTexture!==!0,ne=be.__version===void 0||j===!0,se=V.dataReady,fe=S(y,te);if(y.isDepthTexture)Me=x(y.format===sr,y.type),ne&&(L?t.texStorage2D(s.TEXTURE_2D,1,Me,te.width,te.height):t.texImage2D(s.TEXTURE_2D,0,Me,te.width,te.height,0,he,Pe,null));else if(y.isDataTexture)if(Be.length>0){L&&ne&&t.texStorage2D(s.TEXTURE_2D,fe,Me,Be[0].width,Be[0].height);for(let Q=0,K=Be.length;Q<K;Q++)ce=Be[Q],L?se&&t.texSubImage2D(s.TEXTURE_2D,Q,0,0,ce.width,ce.height,he,Pe,ce.data):t.texImage2D(s.TEXTURE_2D,Q,Me,ce.width,ce.height,0,he,Pe,ce.data);y.generateMipmaps=!1}else L?(ne&&t.texStorage2D(s.TEXTURE_2D,fe,Me,te.width,te.height),se&&et(y,te,he,Pe)):t.texImage2D(s.TEXTURE_2D,0,Me,te.width,te.height,0,he,Pe,te.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){L&&ne&&t.texStorage3D(s.TEXTURE_2D_ARRAY,fe,Me,Be[0].width,Be[0].height,te.depth);for(let Q=0,K=Be.length;Q<K;Q++)if(ce=Be[Q],y.format!==tn)if(he!==null)if(L){if(se)if(y.layerUpdates.size>0){let ge=uh(ce.width,ce.height,y.format,y.type);for(let Ue of y.layerUpdates){let ht=ce.data.subarray(Ue*ge/ce.data.BYTES_PER_ELEMENT,(Ue+1)*ge/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,Q,0,0,Ue,ce.width,ce.height,1,he,ht)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,Q,0,0,0,ce.width,ce.height,te.depth,he,ce.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,Q,Me,ce.width,ce.height,te.depth,0,ce.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else L?se&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,Q,0,0,0,ce.width,ce.height,te.depth,he,Pe,ce.data):t.texImage3D(s.TEXTURE_2D_ARRAY,Q,Me,ce.width,ce.height,te.depth,0,he,Pe,ce.data)}else{L&&ne&&t.texStorage2D(s.TEXTURE_2D,fe,Me,Be[0].width,Be[0].height);for(let Q=0,K=Be.length;Q<K;Q++)ce=Be[Q],y.format!==tn?he!==null?L?se&&t.compressedTexSubImage2D(s.TEXTURE_2D,Q,0,0,ce.width,ce.height,he,ce.data):t.compressedTexImage2D(s.TEXTURE_2D,Q,Me,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):L?se&&t.texSubImage2D(s.TEXTURE_2D,Q,0,0,ce.width,ce.height,he,Pe,ce.data):t.texImage2D(s.TEXTURE_2D,Q,Me,ce.width,ce.height,0,he,Pe,ce.data)}else if(y.isDataArrayTexture)if(L){if(ne&&t.texStorage3D(s.TEXTURE_2D_ARRAY,fe,Me,te.width,te.height,te.depth),se)if(y.layerUpdates.size>0){let Q=uh(te.width,te.height,y.format,y.type);for(let K of y.layerUpdates){let ge=te.data.subarray(K*Q/te.data.BYTES_PER_ELEMENT,(K+1)*Q/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,K,te.width,te.height,1,he,Pe,ge)}y.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,he,Pe,te.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Me,te.width,te.height,te.depth,0,he,Pe,te.data);else if(y.isData3DTexture)L?(ne&&t.texStorage3D(s.TEXTURE_3D,fe,Me,te.width,te.height,te.depth),se&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,he,Pe,te.data)):t.texImage3D(s.TEXTURE_3D,0,Me,te.width,te.height,te.depth,0,he,Pe,te.data);else if(y.isFramebufferTexture){if(ne)if(L)t.texStorage2D(s.TEXTURE_2D,fe,Me,te.width,te.height);else{let Q=te.width,K=te.height;for(let ge=0;ge<fe;ge++)t.texImage2D(s.TEXTURE_2D,ge,Me,Q,K,0,he,Pe,null),Q>>=1,K>>=1}}else if(Be.length>0){if(L&&ne){let Q=St(Be[0]);t.texStorage2D(s.TEXTURE_2D,fe,Me,Q.width,Q.height)}for(let Q=0,K=Be.length;Q<K;Q++)ce=Be[Q],L?se&&t.texSubImage2D(s.TEXTURE_2D,Q,0,0,he,Pe,ce):t.texImage2D(s.TEXTURE_2D,Q,Me,he,Pe,ce);y.generateMipmaps=!1}else if(L){if(ne){let Q=St(te);t.texStorage2D(s.TEXTURE_2D,fe,Me,Q.width,Q.height)}se&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,he,Pe,te)}else t.texImage2D(s.TEXTURE_2D,0,Me,he,Pe,te);g(y)&&p(W),be.__version=V.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function Z(A,y,O){if(y.image.length!==6)return;let W=lt(A,y),j=y.source;t.bindTexture(s.TEXTURE_CUBE_MAP,A.__webglTexture,s.TEXTURE0+O);let V=n.get(j);if(j.version!==V.__version||W===!0){t.activeTexture(s.TEXTURE0+O);let be=qe.getPrimaries(qe.workingColorSpace),ie=y.colorSpace===Bn?null:qe.getPrimaries(y.colorSpace),ye=y.colorSpace===Bn||be===ie?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,ye);let ve=y.isCompressedTexture||y.image[0].isCompressedTexture,te=y.image[0]&&y.image[0].isDataTexture,he=[];for(let K=0;K<6;K++)!ve&&!te?he[K]=_(y.image[K],!0,i.maxCubemapSize):he[K]=te?y.image[K].image:y.image[K],he[K]=Ut(y,he[K]);let Pe=he[0],Me=r.convert(y.format,y.colorSpace),ce=r.convert(y.type),Be=v(y.internalFormat,Me,ce,y.colorSpace),L=y.isVideoTexture!==!0,ne=V.__version===void 0||W===!0,se=j.dataReady,fe=S(y,Pe);Ge(s.TEXTURE_CUBE_MAP,y);let Q;if(ve){L&&ne&&t.texStorage2D(s.TEXTURE_CUBE_MAP,fe,Be,Pe.width,Pe.height);for(let K=0;K<6;K++){Q=he[K].mipmaps;for(let ge=0;ge<Q.length;ge++){let Ue=Q[ge];y.format!==tn?Me!==null?L?se&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge,0,0,Ue.width,Ue.height,Me,Ue.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge,Be,Ue.width,Ue.height,0,Ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge,0,0,Ue.width,Ue.height,Me,ce,Ue.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge,Be,Ue.width,Ue.height,0,Me,ce,Ue.data)}}}else{if(Q=y.mipmaps,L&&ne){Q.length>0&&fe++;let K=St(he[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,fe,Be,K.width,K.height)}for(let K=0;K<6;K++)if(te){L?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,he[K].width,he[K].height,Me,ce,he[K].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Be,he[K].width,he[K].height,0,Me,ce,he[K].data);for(let ge=0;ge<Q.length;ge++){let ht=Q[ge].image[K].image;L?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge+1,0,0,ht.width,ht.height,Me,ce,ht.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge+1,Be,ht.width,ht.height,0,Me,ce,ht.data)}}else{L?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Me,ce,he[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Be,Me,ce,he[K]);for(let ge=0;ge<Q.length;ge++){let Ue=Q[ge];L?se&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge+1,0,0,Me,ce,Ue.image[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ge+1,Be,Me,ce,Ue.image[K])}}}g(y)&&p(s.TEXTURE_CUBE_MAP),V.__version=j.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function pe(A,y,O,W,j,V){let be=r.convert(O.format,O.colorSpace),ie=r.convert(O.type),ye=v(O.internalFormat,be,ie,O.colorSpace),ve=n.get(y),te=n.get(O);if(te.__renderTarget=y,!ve.__hasExternalTextures){let he=Math.max(1,y.width>>V),Pe=Math.max(1,y.height>>V);j===s.TEXTURE_3D||j===s.TEXTURE_2D_ARRAY?t.texImage3D(j,V,ye,he,Pe,y.depth,0,be,ie,null):t.texImage2D(j,V,ye,he,Pe,0,be,ie,null)}t.bindFramebuffer(s.FRAMEBUFFER,A),xe(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,W,j,te.__webglTexture,0,_t(y)):(j===s.TEXTURE_2D||j>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,W,j,te.__webglTexture,V),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ne(A,y,O){if(s.bindRenderbuffer(s.RENDERBUFFER,A),y.depthBuffer){let W=y.depthTexture,j=W&&W.isDepthTexture?W.type:null,V=x(y.stencilBuffer,j),be=y.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ie=_t(y);xe(y)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,ie,V,y.width,y.height):O?s.renderbufferStorageMultisample(s.RENDERBUFFER,ie,V,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,V,y.width,y.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,be,s.RENDERBUFFER,A)}else{let W=y.textures;for(let j=0;j<W.length;j++){let V=W[j],be=r.convert(V.format,V.colorSpace),ie=r.convert(V.type),ye=v(V.internalFormat,be,ie,V.colorSpace),ve=_t(y);O&&xe(y)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,ve,ye,y.width,y.height):xe(y)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,ve,ye,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,ye,y.width,y.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Se(A,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let W=n.get(y.depthTexture);W.__renderTarget=y,(!W.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),G(y.depthTexture,0);let j=W.__webglTexture,V=_t(y);if(y.depthTexture.format===ks)xe(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,j,0,V):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,j,0);else if(y.depthTexture.format===sr)xe(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,j,0,V):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function $e(A){let y=n.get(A),O=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let W=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),W){let j=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,W.removeEventListener("dispose",j)};W.addEventListener("dispose",j),y.__depthDisposeCallback=j}y.__boundDepthTexture=W}if(A.depthTexture&&!y.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");let W=A.texture.mipmaps;W&&W.length>0?Se(y.__webglFramebuffer[0],A):Se(y.__webglFramebuffer,A)}else if(O){y.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer[W]),y.__webglDepthbuffer[W]===void 0)y.__webglDepthbuffer[W]=s.createRenderbuffer(),Ne(y.__webglDepthbuffer[W],A,!1);else{let j=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,V=y.__webglDepthbuffer[W];s.bindRenderbuffer(s.RENDERBUFFER,V),s.framebufferRenderbuffer(s.FRAMEBUFFER,j,s.RENDERBUFFER,V)}}else{let W=A.texture.mipmaps;if(W&&W.length>0?t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=s.createRenderbuffer(),Ne(y.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,V=y.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,V),s.framebufferRenderbuffer(s.FRAMEBUFFER,j,s.RENDERBUFFER,V)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function Gt(A,y,O){let W=n.get(A);y!==void 0&&pe(W.__webglFramebuffer,A,A.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),O!==void 0&&$e(A)}function I(A){let y=A.texture,O=n.get(A),W=n.get(y);A.addEventListener("dispose",C);let j=A.textures,V=A.isWebGLCubeRenderTarget===!0,be=j.length>1;if(be||(W.__webglTexture===void 0&&(W.__webglTexture=s.createTexture()),W.__version=y.version,o.memory.textures++),V){O.__webglFramebuffer=[];for(let ie=0;ie<6;ie++)if(y.mipmaps&&y.mipmaps.length>0){O.__webglFramebuffer[ie]=[];for(let ye=0;ye<y.mipmaps.length;ye++)O.__webglFramebuffer[ie][ye]=s.createFramebuffer()}else O.__webglFramebuffer[ie]=s.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){O.__webglFramebuffer=[];for(let ie=0;ie<y.mipmaps.length;ie++)O.__webglFramebuffer[ie]=s.createFramebuffer()}else O.__webglFramebuffer=s.createFramebuffer();if(be)for(let ie=0,ye=j.length;ie<ye;ie++){let ve=n.get(j[ie]);ve.__webglTexture===void 0&&(ve.__webglTexture=s.createTexture(),o.memory.textures++)}if(A.samples>0&&xe(A)===!1){O.__webglMultisampledFramebuffer=s.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let ie=0;ie<j.length;ie++){let ye=j[ie];O.__webglColorRenderbuffer[ie]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,O.__webglColorRenderbuffer[ie]);let ve=r.convert(ye.format,ye.colorSpace),te=r.convert(ye.type),he=v(ye.internalFormat,ve,te,ye.colorSpace,A.isXRRenderTarget===!0),Pe=_t(A);s.renderbufferStorageMultisample(s.RENDERBUFFER,Pe,he,A.width,A.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ie,s.RENDERBUFFER,O.__webglColorRenderbuffer[ie])}s.bindRenderbuffer(s.RENDERBUFFER,null),A.depthBuffer&&(O.__webglDepthRenderbuffer=s.createRenderbuffer(),Ne(O.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(V){t.bindTexture(s.TEXTURE_CUBE_MAP,W.__webglTexture),Ge(s.TEXTURE_CUBE_MAP,y);for(let ie=0;ie<6;ie++)if(y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)pe(O.__webglFramebuffer[ie][ye],A,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye);else pe(O.__webglFramebuffer[ie],A,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0);g(y)&&p(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(be){for(let ie=0,ye=j.length;ie<ye;ie++){let ve=j[ie],te=n.get(ve),he=s.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(he=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(he,te.__webglTexture),Ge(he,ve),pe(O.__webglFramebuffer,A,ve,s.COLOR_ATTACHMENT0+ie,he,0),g(ve)&&p(he)}t.unbindTexture()}else{let ie=s.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ie=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(ie,W.__webglTexture),Ge(ie,y),y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)pe(O.__webglFramebuffer[ye],A,y,s.COLOR_ATTACHMENT0,ie,ye);else pe(O.__webglFramebuffer,A,y,s.COLOR_ATTACHMENT0,ie,0);g(y)&&p(ie),t.unbindTexture()}A.depthBuffer&&$e(A)}function gt(A){let y=A.textures;for(let O=0,W=y.length;O<W;O++){let j=y[O];if(g(j)){let V=b(A),be=n.get(j).__webglTexture;t.bindTexture(V,be),p(V),t.unbindTexture()}}}let Oe=[],Le=[];function _e(A){if(A.samples>0){if(xe(A)===!1){let y=A.textures,O=A.width,W=A.height,j=s.COLOR_BUFFER_BIT,V=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,be=n.get(A),ie=y.length>1;if(ie)for(let ve=0;ve<y.length;ve++)t.bindFramebuffer(s.FRAMEBUFFER,be.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ve,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,be.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ve,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,be.__webglMultisampledFramebuffer);let ye=A.texture.mipmaps;ye&&ye.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,be.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,be.__webglFramebuffer);for(let ve=0;ve<y.length;ve++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(j|=s.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(j|=s.STENCIL_BUFFER_BIT)),ie){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,be.__webglColorRenderbuffer[ve]);let te=n.get(y[ve]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,te,0)}s.blitFramebuffer(0,0,O,W,0,0,O,W,j,s.NEAREST),c===!0&&(Oe.length=0,Le.length=0,Oe.push(s.COLOR_ATTACHMENT0+ve),A.depthBuffer&&A.resolveDepthBuffer===!1&&(Oe.push(V),Le.push(V),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Le)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Oe))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),ie)for(let ve=0;ve<y.length;ve++){t.bindFramebuffer(s.FRAMEBUFFER,be.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ve,s.RENDERBUFFER,be.__webglColorRenderbuffer[ve]);let te=n.get(y[ve]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,be.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ve,s.TEXTURE_2D,te,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,be.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&c){let y=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[y])}}}function _t(A){return Math.min(i.maxSamples,A.samples)}function xe(A){let y=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function He(A){let y=o.render.frame;h.get(A)!==y&&(h.set(A,y),A.update())}function Ut(A,y){let O=A.colorSpace,W=A.format,j=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||O!==Ht&&O!==Bn&&(qe.getTransfer(O)===st?(W!==tn||j!==Fn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),y}function St(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=z,this.resetTextureUnits=k,this.setTexture2D=G,this.setTexture2DArray=Y,this.setTexture3D=J,this.setTextureCube=H,this.rebindTextures=Gt,this.setupRenderTarget=I,this.updateRenderTargetMipmap=gt,this.updateMultisampleRenderTarget=_e,this.setupDepthRenderbuffer=$e,this.setupFrameBufferTexture=pe,this.useMultisampledRTT=xe}function xv(s,e){function t(n,i=Bn){let r,o=qe.getTransfer(i);if(n===Fn)return s.UNSIGNED_BYTE;if(n===$a)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Ka)return s.UNSIGNED_SHORT_5_5_5_1;if(n===jl)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===Zl)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===$l)return s.BYTE;if(n===Kl)return s.SHORT;if(n===tr)return s.UNSIGNED_SHORT;if(n===qa)return s.INT;if(n===ki)return s.UNSIGNED_INT;if(n===wn)return s.FLOAT;if(n===nr)return s.HALF_FLOAT;if(n===Jl)return s.ALPHA;if(n===Ql)return s.RGB;if(n===tn)return s.RGBA;if(n===ks)return s.DEPTH_COMPONENT;if(n===sr)return s.DEPTH_STENCIL;if(n===ja)return s.RED;if(n===Za)return s.RED_INTEGER;if(n===eh)return s.RG;if(n===Ja)return s.RG_INTEGER;if(n===Qa)return s.RGBA_INTEGER;if(n===po||n===mo||n===go||n===_o)if(o===st)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===po)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===mo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===go)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===_o)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===po)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===mo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===go)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===_o)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ec||n===tc||n===nc||n===ic)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ec)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===tc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===nc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ic)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===sc||n===rc||n===oc)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===sc||n===rc)return o===st?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===oc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ac||n===cc||n===lc||n===hc||n===uc||n===dc||n===fc||n===pc||n===mc||n===gc||n===_c||n===xc||n===yc||n===vc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ac)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===cc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===lc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===hc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===uc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===dc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===fc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===pc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===mc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===gc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===_c)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===xc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===yc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===vc)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Mc||n===bc||n===Sc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Mc)return o===st?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===bc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Sc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===wc||n===Tc||n===Ec||n===Ac)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===wc)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Tc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ec)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ac)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ir?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var yv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,vv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,wh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Xr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Un({vertexShader:yv,fragmentShader:vv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pt(new eo(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Th=class extends Gn{constructor(e,t){super();let n=this,i=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,f=null,d=null,m=null,_=typeof XRWebGLBinding<"u",g=new wh,p={},b=t.getContextAttributes(),v=null,x=null,S=[],T=[],C=new re,N=null,E=new Tt;E.viewport=new Je;let w=new Tt;w.viewport=new Je;let P=[E,w],k=new Ua,z=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let Z=S[q];return Z===void 0&&(Z=new Gs,S[q]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(q){let Z=S[q];return Z===void 0&&(Z=new Gs,S[q]=Z),Z.getGripSpace()},this.getHand=function(q){let Z=S[q];return Z===void 0&&(Z=new Gs,S[q]=Z),Z.getHandSpace()};function G(q){let Z=T.indexOf(q.inputSource);if(Z===-1)return;let pe=S[Z];pe!==void 0&&(pe.update(q.inputSource,q.frame,l||o),pe.dispatchEvent({type:q.type,data:q.inputSource}))}function Y(){i.removeEventListener("select",G),i.removeEventListener("selectstart",G),i.removeEventListener("selectend",G),i.removeEventListener("squeeze",G),i.removeEventListener("squeezestart",G),i.removeEventListener("squeezeend",G),i.removeEventListener("end",Y),i.removeEventListener("inputsourceschange",J);for(let q=0;q<S.length;q++){let Z=T[q];Z!==null&&(T[q]=null,S[q].disconnect(Z))}z=null,X=null,g.reset();for(let q in p)delete p[q];e.setRenderTarget(v),d=null,f=null,u=null,i=null,x=null,et.stop(),n.isPresenting=!1,e.setPixelRatio(N),e.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(q){l=q},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(i,t)),u},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(q){if(i=q,i!==null){if(v=e.getRenderTarget(),i.addEventListener("select",G),i.addEventListener("selectstart",G),i.addEventListener("selectend",G),i.addEventListener("squeeze",G),i.addEventListener("squeezestart",G),i.addEventListener("squeezeend",G),i.addEventListener("end",Y),i.addEventListener("inputsourceschange",J),b.xrCompatible!==!0&&await t.makeXRCompatible(),N=e.getPixelRatio(),e.getSize(C),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let pe=null,Ne=null,Se=null;b.depth&&(Se=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,pe=b.stencil?sr:ks,Ne=b.stencil?ir:ki);let $e={colorFormat:t.RGBA8,depthFormat:Se,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer($e),i.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),x=new Wn(f.textureWidth,f.textureHeight,{format:tn,type:Fn,depthTexture:new Wr(f.textureWidth,f.textureHeight,Ne,void 0,void 0,void 0,void 0,void 0,void 0,pe),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let pe={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,t,pe),i.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new Wn(d.framebufferWidth,d.framebufferHeight,{format:tn,type:Fn,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(a),et.setContext(i),et.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function J(q){for(let Z=0;Z<q.removed.length;Z++){let pe=q.removed[Z],Ne=T.indexOf(pe);Ne>=0&&(T[Ne]=null,S[Ne].disconnect(pe))}for(let Z=0;Z<q.added.length;Z++){let pe=q.added[Z],Ne=T.indexOf(pe);if(Ne===-1){for(let $e=0;$e<S.length;$e++)if($e>=T.length){T.push(pe),Ne=$e;break}else if(T[$e]===null){T[$e]=pe,Ne=$e;break}if(Ne===-1)break}let Se=S[Ne];Se&&Se.connect(pe)}}let H=new R,ae=new R;function ue(q,Z,pe){H.setFromMatrixPosition(Z.matrixWorld),ae.setFromMatrixPosition(pe.matrixWorld);let Ne=H.distanceTo(ae),Se=Z.projectionMatrix.elements,$e=pe.projectionMatrix.elements,Gt=Se[14]/(Se[10]-1),I=Se[14]/(Se[10]+1),gt=(Se[9]+1)/Se[5],Oe=(Se[9]-1)/Se[5],Le=(Se[8]-1)/Se[0],_e=($e[8]+1)/$e[0],_t=Gt*Le,xe=Gt*_e,He=Ne/(-Le+_e),Ut=He*-Le;if(Z.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Ut),q.translateZ(He),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),Se[10]===-1)q.projectionMatrix.copy(Z.projectionMatrix),q.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{let St=Gt+He,A=I+He,y=_t-Ut,O=xe+(Ne-Ut),W=gt*I/A*St,j=Oe*I/A*St;q.projectionMatrix.makePerspective(y,O,W,j,St,A),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function Te(q,Z){Z===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(Z.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(i===null)return;let Z=q.near,pe=q.far;g.texture!==null&&(g.depthNear>0&&(Z=g.depthNear),g.depthFar>0&&(pe=g.depthFar)),k.near=w.near=E.near=Z,k.far=w.far=E.far=pe,(z!==k.near||X!==k.far)&&(i.updateRenderState({depthNear:k.near,depthFar:k.far}),z=k.near,X=k.far),k.layers.mask=q.layers.mask|6,E.layers.mask=k.layers.mask&3,w.layers.mask=k.layers.mask&5;let Ne=q.parent,Se=k.cameras;Te(k,Ne);for(let $e=0;$e<Se.length;$e++)Te(Se[$e],Ne);Se.length===2?ue(k,E,w):k.projectionMatrix.copy(E.projectionMatrix),Ge(q,k,Ne)};function Ge(q,Z,pe){pe===null?q.matrix.copy(Z.matrixWorld):(q.matrix.copy(pe.matrixWorld),q.matrix.invert(),q.matrix.multiply(Z.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(Z.projectionMatrix),q.projectionMatrixInverse.copy(Z.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=ts*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(!(f===null&&d===null))return c},this.setFoveation=function(q){c=q,f!==null&&(f.fixedFoveation=q),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=q)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(k)},this.getCameraTexture=function(q){return p[q]};let lt=null;function mt(q,Z){if(h=Z.getViewerPose(l||o),m=Z,h!==null){let pe=h.views;d!==null&&(e.setRenderTargetFramebuffer(x,d.framebuffer),e.setRenderTarget(x));let Ne=!1;pe.length!==k.cameras.length&&(k.cameras.length=0,Ne=!0);for(let I=0;I<pe.length;I++){let gt=pe[I],Oe=null;if(d!==null)Oe=d.getViewport(gt);else{let _e=u.getViewSubImage(f,gt);Oe=_e.viewport,I===0&&(e.setRenderTargetTextures(x,_e.colorTexture,_e.depthStencilTexture),e.setRenderTarget(x))}let Le=P[I];Le===void 0&&(Le=new Tt,Le.layers.enable(I),Le.viewport=new Je,P[I]=Le),Le.matrix.fromArray(gt.transform.matrix),Le.matrix.decompose(Le.position,Le.quaternion,Le.scale),Le.projectionMatrix.fromArray(gt.projectionMatrix),Le.projectionMatrixInverse.copy(Le.projectionMatrix).invert(),Le.viewport.set(Oe.x,Oe.y,Oe.width,Oe.height),I===0&&(k.matrix.copy(Le.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),Ne===!0&&k.cameras.push(Le)}let Se=i.enabledFeatures;if(Se&&Se.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){u=n.getBinding();let I=u.getDepthInformation(pe[0]);I&&I.isValid&&I.texture&&g.init(I,i.renderState)}if(Se&&Se.includes("camera-access")&&_){e.state.unbindTexture(),u=n.getBinding();for(let I=0;I<pe.length;I++){let gt=pe[I].camera;if(gt){let Oe=p[gt];Oe||(Oe=new Xr,p[gt]=Oe);let Le=u.getCameraImage(gt);Oe.sourceTexture=Le}}}}for(let pe=0;pe<S.length;pe++){let Ne=T[pe],Se=S[pe];Ne!==null&&Se!==void 0&&Se.update(Ne,Z,l||o)}lt&&lt(q,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),m=null}let et=new mp;et.setAnimationLoop(mt),this.setAnimationLoop=function(q){lt=q},this.dispose=function(){}}},ds=new Dn,Mv=new Ce;function bv(s,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,ah(s)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function i(g,p,b,v,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),u(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),f(g,p),p.isMeshPhysicalMaterial&&d(g,p,x)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),_(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?c(g,p,b,v):p.isSpriteMaterial?l(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===en&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===en&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let b=e.get(p),v=b.envMap,x=b.envMapRotation;v&&(g.envMap.value=v,ds.copy(x),ds.x*=-1,ds.y*=-1,ds.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(ds.y*=-1,ds.z*=-1),g.envMapRotation.value.setFromMatrix4(Mv.makeRotationFromEuler(ds)),g.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function c(g,p,b,v){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*b,g.scale.value=v*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function l(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function f(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function d(g,p,b){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===en&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=b.texture,g.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function _(g,p){let b=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(b.matrixWorld),g.nearDistance.value=b.shadow.camera.near,g.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Sv(s,e,t,n){let i={},r={},o=[],a=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function c(b,v){let x=v.program;n.uniformBlockBinding(b,x)}function l(b,v){let x=i[b.id];x===void 0&&(m(b),x=h(b),i[b.id]=x,b.addEventListener("dispose",g));let S=v.program;n.updateUBOMapping(b,S);let T=e.render.frame;r[b.id]!==T&&(f(b),r[b.id]=T)}function h(b){let v=u();b.__bindingPointIndex=v;let x=s.createBuffer(),S=b.__size,T=b.usage;return s.bindBuffer(s.UNIFORM_BUFFER,x),s.bufferData(s.UNIFORM_BUFFER,S,T),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,v,x),x}function u(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(b){let v=i[b.id],x=b.uniforms,S=b.__cache;s.bindBuffer(s.UNIFORM_BUFFER,v);for(let T=0,C=x.length;T<C;T++){let N=Array.isArray(x[T])?x[T]:[x[T]];for(let E=0,w=N.length;E<w;E++){let P=N[E];if(d(P,T,E,S)===!0){let k=P.__offset,z=Array.isArray(P.value)?P.value:[P.value],X=0;for(let G=0;G<z.length;G++){let Y=z[G],J=_(Y);typeof Y=="number"||typeof Y=="boolean"?(P.__data[0]=Y,s.bufferSubData(s.UNIFORM_BUFFER,k+X,P.__data)):Y.isMatrix3?(P.__data[0]=Y.elements[0],P.__data[1]=Y.elements[1],P.__data[2]=Y.elements[2],P.__data[3]=0,P.__data[4]=Y.elements[3],P.__data[5]=Y.elements[4],P.__data[6]=Y.elements[5],P.__data[7]=0,P.__data[8]=Y.elements[6],P.__data[9]=Y.elements[7],P.__data[10]=Y.elements[8],P.__data[11]=0):(Y.toArray(P.__data,X),X+=J.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,k,P.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function d(b,v,x,S){let T=b.value,C=v+"_"+x;if(S[C]===void 0)return typeof T=="number"||typeof T=="boolean"?S[C]=T:S[C]=T.clone(),!0;{let N=S[C];if(typeof T=="number"||typeof T=="boolean"){if(N!==T)return S[C]=T,!0}else if(N.equals(T)===!1)return N.copy(T),!0}return!1}function m(b){let v=b.uniforms,x=0,S=16;for(let C=0,N=v.length;C<N;C++){let E=Array.isArray(v[C])?v[C]:[v[C]];for(let w=0,P=E.length;w<P;w++){let k=E[w],z=Array.isArray(k.value)?k.value:[k.value];for(let X=0,G=z.length;X<G;X++){let Y=z[X],J=_(Y),H=x%S,ae=H%J.boundary,ue=H+ae;x+=ae,ue!==0&&S-ue<J.storage&&(x+=S-ue),k.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=x,x+=J.storage}}}let T=x%S;return T>0&&(x+=S-T),b.__size=x,b.__cache={},this}function _(b){let v={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(v.boundary=4,v.storage=4):b.isVector2?(v.boundary=8,v.storage=8):b.isVector3||b.isColor?(v.boundary=16,v.storage=12):b.isVector4?(v.boundary=16,v.storage=16):b.isMatrix3?(v.boundary=48,v.storage=48):b.isMatrix4?(v.boundary=64,v.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),v}function g(b){let v=b.target;v.removeEventListener("dispose",g);let x=o.indexOf(v.__bindingPointIndex);o.splice(x,1),s.deleteBuffer(i[v.id]),delete i[v.id],delete r[v.id]}function p(){for(let b in i)s.deleteBuffer(i[b]);o=[],i={},r={}}return{bind:c,update:l,dispose:p}}var Lc=class{constructor(e={}){let{canvas:t=Of(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let m=new Uint32Array(4),_=new Int32Array(4),g=null,p=null,b=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=gi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,S=!1;this._outputColorSpace=ct;let T=0,C=0,N=null,E=-1,w=null,P=new Je,k=new Je,z=null,X=new we(0),G=0,Y=t.width,J=t.height,H=1,ae=null,ue=null,Te=new Je(0,0,Y,J),Ge=new Je(0,0,Y,J),lt=!1,mt=new qs,et=!1,q=!1,Z=new Ce,pe=new R,Ne=new Je,Se={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},$e=!1;function Gt(){return N===null?H:1}let I=n;function gt(M,D){return t.getContext(M,D)}try{let M={alpha:!0,depth:i,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",se,!1),t.addEventListener("webglcontextrestored",fe,!1),t.addEventListener("webglcontextcreationerror",Q,!1),I===null){let D="webgl2";if(I=gt(D,M),I===null)throw gt(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Oe,Le,_e,_t,xe,He,Ut,St,A,y,O,W,j,V,be,ie,ye,ve,te,he,Pe,Me,ce,Be;function L(){Oe=new Hx(I),Oe.init(),Me=new xv(I,Oe),Le=new Nx(I,Oe,e,Me),_e=new gv(I,Oe),Le.reversedDepthBuffer&&f&&_e.buffers.depth.setReversed(!0),_t=new Wx(I),xe=new iv,He=new _v(I,Oe,_e,xe,Le,Me,_t),Ut=new Ox(x),St=new zx(x),A=new jg(I),ce=new Lx(I,A),y=new Vx(I,A,_t,ce),O=new Yx(I,y,A,_t),te=new Xx(I,Le,He),ie=new Ux(xe),W=new nv(x,Ut,St,Oe,Le,ce,ie),j=new bv(x,xe),V=new rv,be=new uv(Oe),ve=new Px(x,Ut,St,_e,O,d,c),ye=new pv(x,O,Le),Be=new Sv(I,_t,Le,_e),he=new Dx(I,Oe,_t),Pe=new Gx(I,Oe,_t),_t.programs=W.programs,x.capabilities=Le,x.extensions=Oe,x.properties=xe,x.renderLists=V,x.shadowMap=ye,x.state=_e,x.info=_t}L();let ne=new Th(x,I);this.xr=ne,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let M=Oe.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Oe.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(M){M!==void 0&&(H=M,this.setSize(Y,J,!1))},this.getSize=function(M){return M.set(Y,J)},this.setSize=function(M,D,F=!0){if(ne.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=M,J=D,t.width=Math.floor(M*H),t.height=Math.floor(D*H),F===!0&&(t.style.width=M+"px",t.style.height=D+"px"),this.setViewport(0,0,M,D)},this.getDrawingBufferSize=function(M){return M.set(Y*H,J*H).floor()},this.setDrawingBufferSize=function(M,D,F){Y=M,J=D,H=F,t.width=Math.floor(M*F),t.height=Math.floor(D*F),this.setViewport(0,0,M,D)},this.getCurrentViewport=function(M){return M.copy(P)},this.getViewport=function(M){return M.copy(Te)},this.setViewport=function(M,D,F,B){M.isVector4?Te.set(M.x,M.y,M.z,M.w):Te.set(M,D,F,B),_e.viewport(P.copy(Te).multiplyScalar(H).round())},this.getScissor=function(M){return M.copy(Ge)},this.setScissor=function(M,D,F,B){M.isVector4?Ge.set(M.x,M.y,M.z,M.w):Ge.set(M,D,F,B),_e.scissor(k.copy(Ge).multiplyScalar(H).round())},this.getScissorTest=function(){return lt},this.setScissorTest=function(M){_e.setScissorTest(lt=M)},this.setOpaqueSort=function(M){ae=M},this.setTransparentSort=function(M){ue=M},this.getClearColor=function(M){return M.copy(ve.getClearColor())},this.setClearColor=function(){ve.setClearColor(...arguments)},this.getClearAlpha=function(){return ve.getClearAlpha()},this.setClearAlpha=function(){ve.setClearAlpha(...arguments)},this.clear=function(M=!0,D=!0,F=!0){let B=0;if(M){let U=!1;if(N!==null){let ee=N.texture.format;U=ee===Qa||ee===Ja||ee===Za}if(U){let ee=N.texture.type,le=ee===Fn||ee===ki||ee===tr||ee===ir||ee===$a||ee===Ka,me=ve.getClearColor(),de=ve.getClearAlpha(),Ie=me.r,De=me.g,Ee=me.b;le?(m[0]=Ie,m[1]=De,m[2]=Ee,m[3]=de,I.clearBufferuiv(I.COLOR,0,m)):(_[0]=Ie,_[1]=De,_[2]=Ee,_[3]=de,I.clearBufferiv(I.COLOR,0,_))}else B|=I.COLOR_BUFFER_BIT}D&&(B|=I.DEPTH_BUFFER_BIT),F&&(B|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",se,!1),t.removeEventListener("webglcontextrestored",fe,!1),t.removeEventListener("webglcontextcreationerror",Q,!1),ve.dispose(),V.dispose(),be.dispose(),xe.dispose(),Ut.dispose(),St.dispose(),O.dispose(),ce.dispose(),Be.dispose(),W.dispose(),ne.dispose(),ne.removeEventListener("sessionstart",kn),ne.removeEventListener("sessionend",Cu),Gi.stop()};function se(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),S=!0}function fe(){console.log("THREE.WebGLRenderer: Context Restored."),S=!1;let M=_t.autoReset,D=ye.enabled,F=ye.autoUpdate,B=ye.needsUpdate,U=ye.type;L(),_t.autoReset=M,ye.enabled=D,ye.autoUpdate=F,ye.needsUpdate=B,ye.type=U}function Q(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function K(M){let D=M.target;D.removeEventListener("dispose",K),ge(D)}function ge(M){Ue(M),xe.remove(M)}function Ue(M){let D=xe.get(M).programs;D!==void 0&&(D.forEach(function(F){W.releaseProgram(F)}),M.isShaderMaterial&&W.releaseShaderCache(M))}this.renderBufferDirect=function(M,D,F,B,U,ee){D===null&&(D=Se);let le=U.isMesh&&U.matrixWorld.determinant()<0,me=Vp(M,D,F,B,U);_e.setMaterial(B,le);let de=F.index,Ie=1;if(B.wireframe===!0){if(de=y.getWireframeAttribute(F),de===void 0)return;Ie=2}let De=F.drawRange,Ee=F.attributes.position,Ye=De.start*Ie,rt=(De.start+De.count)*Ie;ee!==null&&(Ye=Math.max(Ye,ee.start*Ie),rt=Math.min(rt,(ee.start+ee.count)*Ie)),de!==null?(Ye=Math.max(Ye,0),rt=Math.min(rt,de.count)):Ee!=null&&(Ye=Math.max(Ye,0),rt=Math.min(rt,Ee.count));let bt=rt-Ye;if(bt<0||bt===1/0)return;ce.setup(U,B,me,F,de);let dt,at=he;if(de!==null&&(dt=A.get(de),at=Pe,at.setIndex(dt)),U.isMesh)B.wireframe===!0?(_e.setLineWidth(B.wireframeLinewidth*Gt()),at.setMode(I.LINES)):at.setMode(I.TRIANGLES);else if(U.isLine){let Ae=B.linewidth;Ae===void 0&&(Ae=1),_e.setLineWidth(Ae*Gt()),U.isLineSegments?at.setMode(I.LINES):U.isLineLoop?at.setMode(I.LINE_LOOP):at.setMode(I.LINE_STRIP)}else U.isPoints?at.setMode(I.POINTS):U.isSprite&&at.setMode(I.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)Hs("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),at.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(Oe.get("WEBGL_multi_draw"))at.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{let Ae=U._multiDrawStarts,xt=U._multiDrawCounts,je=U._multiDrawCount,dn=de?A.get(de).bytesPerElement:1,xs=xe.get(B).currentProgram.getUniforms();for(let fn=0;fn<je;fn++)xs.setValue(I,"_gl_DrawID",fn),at.render(Ae[fn]/dn,xt[fn])}else if(U.isInstancedMesh)at.renderInstances(Ye,bt,U.count);else if(F.isInstancedBufferGeometry){let Ae=F._maxInstanceCount!==void 0?F._maxInstanceCount:1/0,xt=Math.min(F.instanceCount,Ae);at.renderInstances(Ye,bt,xt)}else at.render(Ye,bt)};function ht(M,D,F){M.transparent===!0&&M.side===At&&M.forceSinglePass===!1?(M.side=en,M.needsUpdate=!0,Ao(M,D,F),M.side=Ln,M.needsUpdate=!0,Ao(M,D,F),M.side=At):Ao(M,D,F)}this.compile=function(M,D,F=null){F===null&&(F=M),p=be.get(F),p.init(D),v.push(p),F.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),M!==F&&M.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights();let B=new Set;return M.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;let ee=U.material;if(ee)if(Array.isArray(ee))for(let le=0;le<ee.length;le++){let me=ee[le];ht(me,F,U),B.add(me)}else ht(ee,F,U),B.add(ee)}),p=v.pop(),B},this.compileAsync=function(M,D,F=null){let B=this.compile(M,D,F);return new Promise(U=>{function ee(){if(B.forEach(function(le){xe.get(le).currentProgram.isReady()&&B.delete(le)}),B.size===0){U(M);return}setTimeout(ee,10)}Oe.get("KHR_parallel_shader_compile")!==null?ee():setTimeout(ee,10)})};let tt=null;function Jn(M){tt&&tt(M)}function kn(){Gi.stop()}function Cu(){Gi.start()}let Gi=new mp;Gi.setAnimationLoop(Jn),typeof self<"u"&&Gi.setContext(self),this.setAnimationLoop=function(M){tt=M,ne.setAnimationLoop(M),M===null?Gi.stop():Gi.start()},ne.addEventListener("sessionstart",kn),ne.addEventListener("sessionend",Cu),this.render=function(M,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(S===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),ne.enabled===!0&&ne.isPresenting===!0&&(ne.cameraAutoUpdate===!0&&ne.updateCamera(D),D=ne.getCamera()),M.isScene===!0&&M.onBeforeRender(x,M,D,N),p=be.get(M,v.length),p.init(D),v.push(p),Z.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),mt.setFromProjectionMatrix(Z,Pn,D.reversedDepth),q=this.localClippingEnabled,et=ie.init(this.clippingPlanes,q),g=V.get(M,b.length),g.init(),b.push(g),ne.enabled===!0&&ne.isPresenting===!0){let ee=x.xr.getDepthSensingMesh();ee!==null&&Vc(ee,D,-1/0,x.sortObjects)}Vc(M,D,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(ae,ue),$e=ne.enabled===!1||ne.isPresenting===!1||ne.hasDepthSensing()===!1,$e&&ve.addToRenderList(g,M),this.info.render.frame++,et===!0&&ie.beginShadows();let F=p.state.shadowsArray;ye.render(F,M,D),et===!0&&ie.endShadows(),this.info.autoReset===!0&&this.info.reset();let B=g.opaque,U=g.transmissive;if(p.setupLights(),D.isArrayCamera){let ee=D.cameras;if(U.length>0)for(let le=0,me=ee.length;le<me;le++){let de=ee[le];Pu(B,U,M,de)}$e&&ve.render(M);for(let le=0,me=ee.length;le<me;le++){let de=ee[le];Iu(g,M,de,de.viewport)}}else U.length>0&&Pu(B,U,M,D),$e&&ve.render(M),Iu(g,M,D);N!==null&&C===0&&(He.updateMultisampleRenderTarget(N),He.updateRenderTargetMipmap(N)),M.isScene===!0&&M.onAfterRender(x,M,D),ce.resetDefaultState(),E=-1,w=null,v.pop(),v.length>0?(p=v[v.length-1],et===!0&&ie.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,b.pop(),b.length>0?g=b[b.length-1]:g=null};function Vc(M,D,F,B){if(M.visible===!1)return;if(M.layers.test(D.layers)){if(M.isGroup)F=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(D);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||mt.intersectsSprite(M)){B&&Ne.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Z);let le=O.update(M),me=M.material;me.visible&&g.push(M,le,me,F,Ne.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||mt.intersectsObject(M))){let le=O.update(M),me=M.material;if(B&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ne.copy(M.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),Ne.copy(le.boundingSphere.center)),Ne.applyMatrix4(M.matrixWorld).applyMatrix4(Z)),Array.isArray(me)){let de=le.groups;for(let Ie=0,De=de.length;Ie<De;Ie++){let Ee=de[Ie],Ye=me[Ee.materialIndex];Ye&&Ye.visible&&g.push(M,le,Ye,F,Ne.z,Ee)}}else me.visible&&g.push(M,le,me,F,Ne.z,null)}}let ee=M.children;for(let le=0,me=ee.length;le<me;le++)Vc(ee[le],D,F,B)}function Iu(M,D,F,B){let U=M.opaque,ee=M.transmissive,le=M.transparent;p.setupLightsView(F),et===!0&&ie.setGlobalState(x.clippingPlanes,F),B&&_e.viewport(P.copy(B)),U.length>0&&Eo(U,D,F),ee.length>0&&Eo(ee,D,F),le.length>0&&Eo(le,D,F),_e.buffers.depth.setTest(!0),_e.buffers.depth.setMask(!0),_e.buffers.color.setMask(!0),_e.setPolygonOffset(!1)}function Pu(M,D,F,B){if((F.isScene===!0?F.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[B.id]===void 0&&(p.state.transmissionRenderTarget[B.id]=new Wn(1,1,{generateMipmaps:!0,type:Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float")?nr:Fn,minFilter:_n,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace}));let ee=p.state.transmissionRenderTarget[B.id],le=B.viewport||P;ee.setSize(le.z*x.transmissionResolutionScale,le.w*x.transmissionResolutionScale);let me=x.getRenderTarget(),de=x.getActiveCubeFace(),Ie=x.getActiveMipmapLevel();x.setRenderTarget(ee),x.getClearColor(X),G=x.getClearAlpha(),G<1&&x.setClearColor(16777215,.5),x.clear(),$e&&ve.render(F);let De=x.toneMapping;x.toneMapping=gi;let Ee=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),p.setupLightsView(B),et===!0&&ie.setGlobalState(x.clippingPlanes,B),Eo(M,F,B),He.updateMultisampleRenderTarget(ee),He.updateRenderTargetMipmap(ee),Oe.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let rt=0,bt=D.length;rt<bt;rt++){let dt=D[rt],at=dt.object,Ae=dt.geometry,xt=dt.material,je=dt.group;if(xt.side===At&&at.layers.test(B.layers)){let dn=xt.side;xt.side=en,xt.needsUpdate=!0,Lu(at,F,B,Ae,xt,je),xt.side=dn,xt.needsUpdate=!0,Ye=!0}}Ye===!0&&(He.updateMultisampleRenderTarget(ee),He.updateRenderTargetMipmap(ee))}x.setRenderTarget(me,de,Ie),x.setClearColor(X,G),Ee!==void 0&&(B.viewport=Ee),x.toneMapping=De}function Eo(M,D,F){let B=D.isScene===!0?D.overrideMaterial:null;for(let U=0,ee=M.length;U<ee;U++){let le=M[U],me=le.object,de=le.geometry,Ie=le.group,De=le.material;De.allowOverride===!0&&B!==null&&(De=B),me.layers.test(F.layers)&&Lu(me,D,F,de,De,Ie)}}function Lu(M,D,F,B,U,ee){M.onBeforeRender(x,D,F,B,U,ee),M.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),U.onBeforeRender(x,D,F,B,M,ee),U.transparent===!0&&U.side===At&&U.forceSinglePass===!1?(U.side=en,U.needsUpdate=!0,x.renderBufferDirect(F,D,B,U,M,ee),U.side=Ln,U.needsUpdate=!0,x.renderBufferDirect(F,D,B,U,M,ee),U.side=At):x.renderBufferDirect(F,D,B,U,M,ee),M.onAfterRender(x,D,F,B,U,ee)}function Ao(M,D,F){D.isScene!==!0&&(D=Se);let B=xe.get(M),U=p.state.lights,ee=p.state.shadowsArray,le=U.state.version,me=W.getParameters(M,U.state,ee,D,F),de=W.getProgramCacheKey(me),Ie=B.programs;B.environment=M.isMeshStandardMaterial?D.environment:null,B.fog=D.fog,B.envMap=(M.isMeshStandardMaterial?St:Ut).get(M.envMap||B.environment),B.envMapRotation=B.environment!==null&&M.envMap===null?D.environmentRotation:M.envMapRotation,Ie===void 0&&(M.addEventListener("dispose",K),Ie=new Map,B.programs=Ie);let De=Ie.get(de);if(De!==void 0){if(B.currentProgram===De&&B.lightsStateVersion===le)return Nu(M,me),De}else me.uniforms=W.getUniforms(M),M.onBeforeCompile(me,x),De=W.acquireProgram(me,de),Ie.set(de,De),B.uniforms=me.uniforms;let Ee=B.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ee.clippingPlanes=ie.uniform),Nu(M,me),B.needsLights=Wp(M),B.lightsStateVersion=le,B.needsLights&&(Ee.ambientLightColor.value=U.state.ambient,Ee.lightProbe.value=U.state.probe,Ee.directionalLights.value=U.state.directional,Ee.directionalLightShadows.value=U.state.directionalShadow,Ee.spotLights.value=U.state.spot,Ee.spotLightShadows.value=U.state.spotShadow,Ee.rectAreaLights.value=U.state.rectArea,Ee.ltc_1.value=U.state.rectAreaLTC1,Ee.ltc_2.value=U.state.rectAreaLTC2,Ee.pointLights.value=U.state.point,Ee.pointLightShadows.value=U.state.pointShadow,Ee.hemisphereLights.value=U.state.hemi,Ee.directionalShadowMap.value=U.state.directionalShadowMap,Ee.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Ee.spotShadowMap.value=U.state.spotShadowMap,Ee.spotLightMatrix.value=U.state.spotLightMatrix,Ee.spotLightMap.value=U.state.spotLightMap,Ee.pointShadowMap.value=U.state.pointShadowMap,Ee.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=De,B.uniformsList=null,De}function Du(M){if(M.uniformsList===null){let D=M.currentProgram.getUniforms();M.uniformsList=cr.seqWithValue(D.seq,M.uniforms)}return M.uniformsList}function Nu(M,D){let F=xe.get(M);F.outputColorSpace=D.outputColorSpace,F.batching=D.batching,F.batchingColor=D.batchingColor,F.instancing=D.instancing,F.instancingColor=D.instancingColor,F.instancingMorph=D.instancingMorph,F.skinning=D.skinning,F.morphTargets=D.morphTargets,F.morphNormals=D.morphNormals,F.morphColors=D.morphColors,F.morphTargetsCount=D.morphTargetsCount,F.numClippingPlanes=D.numClippingPlanes,F.numIntersection=D.numClipIntersection,F.vertexAlphas=D.vertexAlphas,F.vertexTangents=D.vertexTangents,F.toneMapping=D.toneMapping}function Vp(M,D,F,B,U){D.isScene!==!0&&(D=Se),He.resetTextureUnits();let ee=D.fog,le=B.isMeshStandardMaterial?D.environment:null,me=N===null?x.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Ht,de=(B.isMeshStandardMaterial?St:Ut).get(B.envMap||le),Ie=B.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,De=!!F.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Ee=!!F.morphAttributes.position,Ye=!!F.morphAttributes.normal,rt=!!F.morphAttributes.color,bt=gi;B.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(bt=x.toneMapping);let dt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,at=dt!==void 0?dt.length:0,Ae=xe.get(B),xt=p.state.lights;if(et===!0&&(q===!0||M!==w)){let jt=M===w&&B.id===E;ie.setState(B,M,jt)}let je=!1;B.version===Ae.__version?(Ae.needsLights&&Ae.lightsStateVersion!==xt.state.version||Ae.outputColorSpace!==me||U.isBatchedMesh&&Ae.batching===!1||!U.isBatchedMesh&&Ae.batching===!0||U.isBatchedMesh&&Ae.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&Ae.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&Ae.instancing===!1||!U.isInstancedMesh&&Ae.instancing===!0||U.isSkinnedMesh&&Ae.skinning===!1||!U.isSkinnedMesh&&Ae.skinning===!0||U.isInstancedMesh&&Ae.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&Ae.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&Ae.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&Ae.instancingMorph===!1&&U.morphTexture!==null||Ae.envMap!==de||B.fog===!0&&Ae.fog!==ee||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==ie.numPlanes||Ae.numIntersection!==ie.numIntersection)||Ae.vertexAlphas!==Ie||Ae.vertexTangents!==De||Ae.morphTargets!==Ee||Ae.morphNormals!==Ye||Ae.morphColors!==rt||Ae.toneMapping!==bt||Ae.morphTargetsCount!==at)&&(je=!0):(je=!0,Ae.__version=B.version);let dn=Ae.currentProgram;je===!0&&(dn=Ao(B,D,U));let xs=!1,fn=!1,dr=!1,yt=dn.getUniforms(),yn=Ae.uniforms;if(_e.useProgram(dn.program)&&(xs=!0,fn=!0,dr=!0),B.id!==E&&(E=B.id,fn=!0),xs||w!==M){_e.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),yt.setValue(I,"projectionMatrix",M.projectionMatrix),yt.setValue(I,"viewMatrix",M.matrixWorldInverse);let sn=yt.map.cameraPosition;sn!==void 0&&sn.setValue(I,pe.setFromMatrixPosition(M.matrixWorld)),Le.logarithmicDepthBuffer&&yt.setValue(I,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&yt.setValue(I,"isOrthographic",M.isOrthographicCamera===!0),w!==M&&(w=M,fn=!0,dr=!0)}if(U.isSkinnedMesh){yt.setOptional(I,U,"bindMatrix"),yt.setOptional(I,U,"bindMatrixInverse");let jt=U.skeleton;jt&&(jt.boneTexture===null&&jt.computeBoneTexture(),yt.setValue(I,"boneTexture",jt.boneTexture,He))}U.isBatchedMesh&&(yt.setOptional(I,U,"batchingTexture"),yt.setValue(I,"batchingTexture",U._matricesTexture,He),yt.setOptional(I,U,"batchingIdTexture"),yt.setValue(I,"batchingIdTexture",U._indirectTexture,He),yt.setOptional(I,U,"batchingColorTexture"),U._colorsTexture!==null&&yt.setValue(I,"batchingColorTexture",U._colorsTexture,He));let vn=F.morphAttributes;if((vn.position!==void 0||vn.normal!==void 0||vn.color!==void 0)&&te.update(U,F,dn),(fn||Ae.receiveShadow!==U.receiveShadow)&&(Ae.receiveShadow=U.receiveShadow,yt.setValue(I,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(yn.envMap.value=de,yn.flipEnvMap.value=de.isCubeTexture&&de.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&D.environment!==null&&(yn.envMapIntensity.value=D.environmentIntensity),fn&&(yt.setValue(I,"toneMappingExposure",x.toneMappingExposure),Ae.needsLights&&Gp(yn,dr),ee&&B.fog===!0&&j.refreshFogUniforms(yn,ee),j.refreshMaterialUniforms(yn,B,H,J,p.state.transmissionRenderTarget[M.id]),cr.upload(I,Du(Ae),yn,He)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(cr.upload(I,Du(Ae),yn,He),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&yt.setValue(I,"center",U.center),yt.setValue(I,"modelViewMatrix",U.modelViewMatrix),yt.setValue(I,"normalMatrix",U.normalMatrix),yt.setValue(I,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){let jt=B.uniformsGroups;for(let sn=0,Gc=jt.length;sn<Gc;sn++){let Wi=jt[sn];Be.update(Wi,dn),Be.bind(Wi,dn)}}return dn}function Gp(M,D){M.ambientLightColor.needsUpdate=D,M.lightProbe.needsUpdate=D,M.directionalLights.needsUpdate=D,M.directionalLightShadows.needsUpdate=D,M.pointLights.needsUpdate=D,M.pointLightShadows.needsUpdate=D,M.spotLights.needsUpdate=D,M.spotLightShadows.needsUpdate=D,M.rectAreaLights.needsUpdate=D,M.hemisphereLights.needsUpdate=D}function Wp(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(M,D,F){let B=xe.get(M);B.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),xe.get(M.texture).__webglTexture=D,xe.get(M.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:F,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,D){let F=xe.get(M);F.__webglFramebuffer=D,F.__useDefaultFramebuffer=D===void 0};let Xp=I.createFramebuffer();this.setRenderTarget=function(M,D=0,F=0){N=M,T=D,C=F;let B=!0,U=null,ee=!1,le=!1;if(M){let de=xe.get(M);if(de.__useDefaultFramebuffer!==void 0)_e.bindFramebuffer(I.FRAMEBUFFER,null),B=!1;else if(de.__webglFramebuffer===void 0)He.setupRenderTarget(M);else if(de.__hasExternalTextures)He.rebindTextures(M,xe.get(M.texture).__webglTexture,xe.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Ee=M.depthTexture;if(de.__boundDepthTexture!==Ee){if(Ee!==null&&xe.has(Ee)&&(M.width!==Ee.image.width||M.height!==Ee.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");He.setupDepthRenderbuffer(M)}}let Ie=M.texture;(Ie.isData3DTexture||Ie.isDataArrayTexture||Ie.isCompressedArrayTexture)&&(le=!0);let De=xe.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(De[D])?U=De[D][F]:U=De[D],ee=!0):M.samples>0&&He.useMultisampledRTT(M)===!1?U=xe.get(M).__webglMultisampledFramebuffer:Array.isArray(De)?U=De[F]:U=De,P.copy(M.viewport),k.copy(M.scissor),z=M.scissorTest}else P.copy(Te).multiplyScalar(H).floor(),k.copy(Ge).multiplyScalar(H).floor(),z=lt;if(F!==0&&(U=Xp),_e.bindFramebuffer(I.FRAMEBUFFER,U)&&B&&_e.drawBuffers(M,U),_e.viewport(P),_e.scissor(k),_e.setScissorTest(z),ee){let de=xe.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+D,de.__webglTexture,F)}else if(le){let de=D;for(let Ie=0;Ie<M.textures.length;Ie++){let De=xe.get(M.textures[Ie]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+Ie,De.__webglTexture,F,de)}}else if(M!==null&&F!==0){let de=xe.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,de.__webglTexture,F)}E=-1},this.readRenderTargetPixels=function(M,D,F,B,U,ee,le,me=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let de=xe.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&le!==void 0&&(de=de[le]),de){_e.bindFramebuffer(I.FRAMEBUFFER,de);try{let Ie=M.textures[me],De=Ie.format,Ee=Ie.type;if(!Le.textureFormatReadable(De)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Le.textureTypeReadable(Ee)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=M.width-B&&F>=0&&F<=M.height-U&&(M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+me),I.readPixels(D,F,B,U,Me.convert(De),Me.convert(Ee),ee))}finally{let Ie=N!==null?xe.get(N).__webglFramebuffer:null;_e.bindFramebuffer(I.FRAMEBUFFER,Ie)}}},this.readRenderTargetPixelsAsync=async function(M,D,F,B,U,ee,le,me=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let de=xe.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&le!==void 0&&(de=de[le]),de)if(D>=0&&D<=M.width-B&&F>=0&&F<=M.height-U){_e.bindFramebuffer(I.FRAMEBUFFER,de);let Ie=M.textures[me],De=Ie.format,Ee=Ie.type;if(!Le.textureFormatReadable(De))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Le.textureTypeReadable(Ee))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.bufferData(I.PIXEL_PACK_BUFFER,ee.byteLength,I.STREAM_READ),M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+me),I.readPixels(D,F,B,U,Me.convert(De),Me.convert(Ee),0);let rt=N!==null?xe.get(N).__webglFramebuffer:null;_e.bindFramebuffer(I.FRAMEBUFFER,rt);let bt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Ff(I,bt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,ee),I.deleteBuffer(Ye),I.deleteSync(bt),ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,D=null,F=0){let B=Math.pow(2,-F),U=Math.floor(M.image.width*B),ee=Math.floor(M.image.height*B),le=D!==null?D.x:0,me=D!==null?D.y:0;He.setTexture2D(M,0),I.copyTexSubImage2D(I.TEXTURE_2D,F,0,0,le,me,U,ee),_e.unbindTexture()};let Yp=I.createFramebuffer(),qp=I.createFramebuffer();this.copyTextureToTexture=function(M,D,F=null,B=null,U=0,ee=null){ee===null&&(U!==0?(Hs("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),ee=U,U=0):ee=0);let le,me,de,Ie,De,Ee,Ye,rt,bt,dt=M.isCompressedTexture?M.mipmaps[ee]:M.image;if(F!==null)le=F.max.x-F.min.x,me=F.max.y-F.min.y,de=F.isBox3?F.max.z-F.min.z:1,Ie=F.min.x,De=F.min.y,Ee=F.isBox3?F.min.z:0;else{let vn=Math.pow(2,-U);le=Math.floor(dt.width*vn),me=Math.floor(dt.height*vn),M.isDataArrayTexture?de=dt.depth:M.isData3DTexture?de=Math.floor(dt.depth*vn):de=1,Ie=0,De=0,Ee=0}B!==null?(Ye=B.x,rt=B.y,bt=B.z):(Ye=0,rt=0,bt=0);let at=Me.convert(D.format),Ae=Me.convert(D.type),xt;D.isData3DTexture?(He.setTexture3D(D,0),xt=I.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(He.setTexture2DArray(D,0),xt=I.TEXTURE_2D_ARRAY):(He.setTexture2D(D,0),xt=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,D.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,D.unpackAlignment);let je=I.getParameter(I.UNPACK_ROW_LENGTH),dn=I.getParameter(I.UNPACK_IMAGE_HEIGHT),xs=I.getParameter(I.UNPACK_SKIP_PIXELS),fn=I.getParameter(I.UNPACK_SKIP_ROWS),dr=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,dt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,dt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Ie),I.pixelStorei(I.UNPACK_SKIP_ROWS,De),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ee);let yt=M.isDataArrayTexture||M.isData3DTexture,yn=D.isDataArrayTexture||D.isData3DTexture;if(M.isDepthTexture){let vn=xe.get(M),jt=xe.get(D),sn=xe.get(vn.__renderTarget),Gc=xe.get(jt.__renderTarget);_e.bindFramebuffer(I.READ_FRAMEBUFFER,sn.__webglFramebuffer),_e.bindFramebuffer(I.DRAW_FRAMEBUFFER,Gc.__webglFramebuffer);for(let Wi=0;Wi<de;Wi++)yt&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,xe.get(M).__webglTexture,U,Ee+Wi),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,xe.get(D).__webglTexture,ee,bt+Wi)),I.blitFramebuffer(Ie,De,le,me,Ye,rt,le,me,I.DEPTH_BUFFER_BIT,I.NEAREST);_e.bindFramebuffer(I.READ_FRAMEBUFFER,null),_e.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(U!==0||M.isRenderTargetTexture||xe.has(M)){let vn=xe.get(M),jt=xe.get(D);_e.bindFramebuffer(I.READ_FRAMEBUFFER,Yp),_e.bindFramebuffer(I.DRAW_FRAMEBUFFER,qp);for(let sn=0;sn<de;sn++)yt?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,vn.__webglTexture,U,Ee+sn):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,vn.__webglTexture,U),yn?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,jt.__webglTexture,ee,bt+sn):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,jt.__webglTexture,ee),U!==0?I.blitFramebuffer(Ie,De,le,me,Ye,rt,le,me,I.COLOR_BUFFER_BIT,I.NEAREST):yn?I.copyTexSubImage3D(xt,ee,Ye,rt,bt+sn,Ie,De,le,me):I.copyTexSubImage2D(xt,ee,Ye,rt,Ie,De,le,me);_e.bindFramebuffer(I.READ_FRAMEBUFFER,null),_e.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else yn?M.isDataTexture||M.isData3DTexture?I.texSubImage3D(xt,ee,Ye,rt,bt,le,me,de,at,Ae,dt.data):D.isCompressedArrayTexture?I.compressedTexSubImage3D(xt,ee,Ye,rt,bt,le,me,de,at,dt.data):I.texSubImage3D(xt,ee,Ye,rt,bt,le,me,de,at,Ae,dt):M.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,ee,Ye,rt,le,me,at,Ae,dt.data):M.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,ee,Ye,rt,dt.width,dt.height,at,dt.data):I.texSubImage2D(I.TEXTURE_2D,ee,Ye,rt,le,me,at,Ae,dt);I.pixelStorei(I.UNPACK_ROW_LENGTH,je),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,dn),I.pixelStorei(I.UNPACK_SKIP_PIXELS,xs),I.pixelStorei(I.UNPACK_SKIP_ROWS,fn),I.pixelStorei(I.UNPACK_SKIP_IMAGES,dr),ee===0&&D.generateMipmaps&&I.generateMipmap(xt),_e.unbindTexture()},this.initRenderTarget=function(M){xe.get(M).__webglFramebuffer===void 0&&He.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?He.setTextureCube(M,0):M.isData3DTexture?He.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?He.setTexture2DArray(M,0):He.setTexture2D(M,0),_e.unbindTexture()},this.resetState=function(){T=0,C=0,N=null,_e.reset(),ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=qe._getUnpackColorSpace()}};function vo(s,e=!1){let t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},o={},a=s[0].morphTargetsRelative,c=new Pt,l=0;for(let h=0;h<s.length;++h){let u=s[h],f=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let d in u.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(u.attributes[d]),f++}if(f!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let d in u.morphAttributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[d]===void 0&&(o[d]=[]),o[d].push(u.morphAttributes[d])}if(e){let d;if(t)d=u.index.count;else if(u.attributes.position!==void 0)d=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,d,h),l+=d}}if(t){let h=0,u=[];for(let f=0;f<s.length;++f){let d=s[f].index;for(let m=0;m<d.count;++m)u.push(d.getX(m)+h);h+=s[f].attributes.position.count}c.setIndex(u)}for(let h in r){let u=vp(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;c.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[h]=[];for(let f=0;f<u;++f){let d=[];for(let _=0;_<o[h].length;++_)d.push(o[h][_][f]);let m=vp(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;c.morphAttributes[h].push(m)}}return c}function vp(s){let e,t,n,i=-1,r=0;for(let l=0;l<s.length;++l){let h=s[l];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}let o=new e(r),a=new Ke(o,t,n),c=0;for(let l=0;l<s.length;++l){let h=s[l];if(h.isInterleavedBufferAttribute){let u=c/t;for(let f=0,d=h.count;f<d;f++)for(let m=0;m<t;m++){let _=h.getComponent(f,m);a.setComponent(f+u,m,_)}}else o.set(h.array,c);c+=h.count*t}return i!==void 0&&(a.gpuType=i),a}function Rh(s,e){if(e===th)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===rr||e===xo){let t=s.getIndex();if(t===null){let o=[],a=s.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);s.setIndex(o),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}let n=t.count-2,i=[];if(e===rr)for(let o=1;o<=n;o++)i.push(t.getX(0)),i.push(t.getX(o)),i.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(t.getX(o)),i.push(t.getX(o+1)),i.push(t.getX(o+2))):(i.push(t.getX(o+2)),i.push(t.getX(o+1)),i.push(t.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=s.clone();return r.setIndex(i),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}var Nc=class extends $n{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Uh(t)}),this.register(function(t){return new Oh(t)}),this.register(function(t){return new Xh(t)}),this.register(function(t){return new Yh(t)}),this.register(function(t){return new qh(t)}),this.register(function(t){return new Bh(t)}),this.register(function(t){return new kh(t)}),this.register(function(t){return new zh(t)}),this.register(function(t){return new Hh(t)}),this.register(function(t){return new Nh(t)}),this.register(function(t){return new Vh(t)}),this.register(function(t){return new Fh(t)}),this.register(function(t){return new Wh(t)}),this.register(function(t){return new Gh(t)}),this.register(function(t){return new Lh(t)}),this.register(function(t){return new $h(t)}),this.register(function(t){return new Kh(t)})}load(e,t,n,i){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let l=pi.extractUrlBase(e);o=pi.resolveURL(l,this.path)}else o=pi.extractUrlBase(e);this.manager.itemStart(e);let a=function(l){i?i(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new Js(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(h){t(h),r.manager.itemEnd(e)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r,o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===Tp){try{o[We.KHR_BINARY_GLTF]=new jh(e)}catch(u){i&&i(u);return}r=JSON.parse(o[We.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new iu(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let u=r.extensionsUsed[h],f=r.extensionsRequired||[];switch(u){case We.KHR_MATERIALS_UNLIT:o[u]=new Dh;break;case We.KHR_DRACO_MESH_COMPRESSION:o[u]=new Zh(r,this.dracoLoader);break;case We.KHR_TEXTURE_TRANSFORM:o[u]=new Jh;break;case We.KHR_MESH_QUANTIZATION:o[u]=new Qh;break;default:f.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}};function wv(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}var We={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Lh=class{constructor(e){this.parser=e,this.name=We.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,h=new we(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],Ht);let u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new Ui(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new as(h),l.distance=u;break;case"spot":l=new os(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),Zn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),i=Promise.resolve(l),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(t.cache,a,c)})}},Dh=class{constructor(){this.name=We.KHR_MATERIALS_UNLIT}getMaterialType(){return Nn}extendParams(e,t,n){let i=[];e.color=new we(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],Ht),e.opacity=o[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,ct))}return Promise.all(i)}},Nh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},Uh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new re(a,a)}return Promise.all(r)}},Oh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_DISPERSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},Fh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},Bh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_SHEEN}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new we(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=i.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],Ht)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,ct)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},kh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},zh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_VOLUME}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new we().setRGB(a[0],a[1],a[2],Ht),Promise.all(r)}},Hh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_IOR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},Vh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_SPECULAR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new we().setRGB(a[0],a[1],a[2],Ht),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,ct)),Promise.all(r)}},Gh=class{constructor(e){this.parser=e,this.name=We.EXT_MATERIALS_BUMP}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},Wh=class{constructor(e){this.parser=e,this.name=We.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},Xh=class{constructor(e){this.parser=e,this.name=We.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},Yh=class{constructor(e){this.parser=e,this.name=We.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return n.loadTextureImage(e,o.source,c)}},qh=class{constructor(e){this.parser=e,this.name=We.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return n.loadTextureImage(e,o.source,c)}},$h=class{constructor(e){this.name=We.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let c=i.byteOffset||0,l=i.byteLength||0,h=i.count,u=i.byteStride,f=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,f,i.mode,i.filter).then(function(d){return d.buffer}):o.ready.then(function(){let d=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(d),h,u,f,i.mode,i.filter),d})})}else return null}},Kh=class{constructor(e){this.name=We.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let l of i.primitives)if(l.mode!==Tn.TRIANGLES&&l.mode!==Tn.TRIANGLE_STRIP&&l.mode!==Tn.TRIANGLE_FAN&&l.mode!==void 0)return null;let o=n.extensions[this.name].attributes,a=[],c={};for(let l in o)a.push(this.parser.getDependency("accessor",o[l]).then(h=>(c[l]=h,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let h=l.pop(),u=h.isGroup?h.children:[h],f=l[0].count,d=[];for(let m of u){let _=new Ce,g=new R,p=new Vt,b=new R(1,1,1),v=new zr(m.geometry,m.material,f);for(let x=0;x<f;x++)c.TRANSLATION&&g.fromBufferAttribute(c.TRANSLATION,x),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,x),c.SCALE&&b.fromBufferAttribute(c.SCALE,x),v.setMatrixAt(x,_.compose(g,p,b));for(let x in c)if(x==="_COLOR_0"){let S=c[x];v.instanceColor=new Li(S.array,S.itemSize,S.normalized)}else x!=="TRANSLATION"&&x!=="ROTATION"&&x!=="SCALE"&&m.geometry.setAttribute(x,c[x]);ut.prototype.copy.call(v,m),this.parser.assignFinalMaterial(v),d.push(v)}return h.isGroup?(h.clear(),h.add(...d),h):d[0]}))}},Tp="glTF",Mo=12,Mp={JSON:1313821514,BIN:5130562},jh=class{constructor(e){this.name=We.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Mo),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Tp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-Mo,r=new DataView(e,Mo),o=0;for(;o<i;){let a=r.getUint32(o,!0);o+=4;let c=r.getUint32(o,!0);if(o+=4,c===Mp.JSON){let l=new Uint8Array(e,Mo+o,a);this.content=n.decode(l)}else if(c===Mp.BIN){let l=Mo+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},Zh=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=We.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(let h in o){let u=tu[h]||h.toLowerCase();a[u]=o[h]}for(let h in e.attributes){let u=tu[h]||h.toLowerCase();if(o[h]!==void 0){let f=n.accessors[e.attributes[h]],d=hr[f.componentType];l[u]=d.name,c[u]=f.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,f){i.decodeDracoFile(h,function(d){for(let m in d.attributes){let _=d.attributes[m],g=c[m];g!==void 0&&(_.normalized=g)}u(d)},a,l,Ht,f)})})}},Jh=class{constructor(){this.name=We.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},Qh=class{constructor(){this.name=We.KHR_MESH_QUANTIZATION}},Uc=class extends hi{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let o=0;o!==i;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,h=i-t,u=(n-t)/h,f=u*u,d=f*u,m=e*l,_=m-l,g=-2*d+3*f,p=d-f,b=1-g,v=p-f+u;for(let x=0;x!==a;x++){let S=o[_+x+a],T=o[_+x+c]*h,C=o[m+x+a],N=o[m+x]*h;r[x]=b*S+v*T+g*C+p*N}return r}},Tv=new Vt,eu=class extends Uc{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return Tv.fromArray(r).normalize().toArray(r),r}},Tn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},hr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},bp={9728:It,9729:zt,9984:er,9985:Bi,9986:_i,9987:_n},Sp={33071:bn,33648:Ii,10497:Vn},Ch={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},tu={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},zi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Ev={CUBICSPLINE:void 0,LINEAR:ai,STEP:oi},Ih={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Av(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new Qt({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Ln})),s.DefaultMaterial}function ms(s,e,t){for(let n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Zn(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Rv(s,e,t){let n=!1,i=!1,r=!1;for(let l=0,h=e.length;l<h;l++){let u=e[l];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);let o=[],a=[],c=[];for(let l=0,h=e.length;l<h;l++){let u=e[l];if(n){let f=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):s.attributes.position;o.push(f)}if(i){let f=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):s.attributes.normal;a.push(f)}if(r){let f=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):s.attributes.color;c.push(f)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let h=l[0],u=l[1],f=l[2];return n&&(s.morphAttributes.position=h),i&&(s.morphAttributes.normal=u),r&&(s.morphAttributes.color=f),s.morphTargetsRelative=!0,s})}function Cv(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Iv(s){let e,t=s.extensions&&s.extensions[We.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Ph(t.attributes):e=s.indices+":"+Ph(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+Ph(s.targets[n]);return e}function Ph(s){let e="",t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function nu(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Pv(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":s.search(/\.ktx2($|\?)/i)>0||s.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var Lv=new Ce,iu=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new wv,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;let c=a.match(/Version\/(\d+)/);i=n&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&o<98?this.textureLoader=new ro(this.options.manager):this.textureLoader=new lo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Js(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){let a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return ms(r,a,i),Zn(a,i),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(let c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let o=t[i].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let o=e[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(o,a)=>{let c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(let[l,h]of o.children.entries())r(h,a.children[l])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[We.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,o){n.load(pi.resolveURL(t.uri,i.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let o=Ch[i.type],a=hr[i.componentType],c=i.normalized===!0,l=new a(i.count*o);return Promise.resolve(new Ke(l,o,c))}let r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],c=Ch[i.type],l=hr[i.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,f=i.byteOffset||0,d=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,m=i.normalized===!0,_,g;if(d&&d!==u){let p=Math.floor(f/d),b="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count,v=t.cache.get(b);v||(_=new l(a,p*d,i.count*d/h),v=new Ws(_,d/h),t.cache.add(b,v)),g=new Xs(v,c,f%d/h,m)}else a===null?_=new l(i.count*c):_=new l(a,f,i.count*c),g=new Ke(_,c,m);if(i.sparse!==void 0){let p=Ch.SCALAR,b=hr[i.sparse.indices.componentType],v=i.sparse.indices.byteOffset||0,x=i.sparse.values.byteOffset||0,S=new b(o[1],v,i.sparse.count*p),T=new l(o[2],x,i.sparse.count*c);a!==null&&(g=new Ke(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let C=0,N=S.length;C<N;C++){let E=S[C];if(g.setX(E,T[C*c]),c>=2&&g.setY(E,T[C*c+1]),c>=3&&g.setZ(E,T[C*c+2]),c>=4&&g.setW(E,T[C*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=m}return g})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let i=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);let f=(r.samplers||{})[o.sampler]||{};return h.magFilter=bp[f.magFilter]||zt,h.minFilter=bp[f.minFilter]||_n,h.wrapS=Sp[f.wrapS]||Vn,h.wrapT=Sp[f.wrapT]||Vn,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==It&&h.minFilter!==zt,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let o=i.images[e],a=self.URL||self.webkitURL,c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(u){l=!0;let f=new Blob([u],{type:o.mimeType});return c=a.createObjectURL(f),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(c).then(function(u){return new Promise(function(f,d){let m=f;t.isImageBitmapLoader===!0&&(m=function(_){let g=new Et(_);g.needsUpdate=!0,f(g)}),t.load(pi.resolveURL(u,r.path),m,void 0,d)})}).then(function(u){return l===!0&&a.revokeObjectURL(c),Zn(u,o),u.userData.mimeType=o.mimeType||Pv(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[We.KHR_TEXTURE_TRANSFORM]){let a=n.extensions!==void 0?n.extensions[We.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let c=r.associations.get(o);o=r.extensions[We.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return i!==void 0&&(o.colorSpace=i),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,n=e.material,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new Di,ln.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(e.isLine){let a="LineBasicMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new $s,ln.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(i||r||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),i&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return Qt}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],o,a={},c=r.extensions||{},l=[];if(c[We.KHR_MATERIALS_UNLIT]){let u=i[We.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(a,r,t))}else{let u=r.pbrMetallicRoughness||{};if(a.color=new we(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){let f=u.baseColorFactor;a.color.setRGB(f[0],f[1],f[2],Ht),a.opacity=f[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",u.baseColorTexture,ct)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=At);let h=r.alphaMode||Ih.OPAQUE;if(h===Ih.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===Ih.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==Nn&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new re(1,1),r.normalTexture.scale!==void 0)){let u=r.normalTexture.scale;a.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&o!==Nn&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==Nn){let u=r.emissiveFactor;a.emissive=new we().setRGB(u[0],u[1],u[2],Ht)}return r.emissiveTexture!==void 0&&o!==Nn&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,ct)),Promise.all(l).then(function(){let u=new o(a);return r.name&&(u.name=r.name),Zn(u,r),t.associations.set(u,{materials:e}),r.extensions&&ms(i,u,r),u})}createUniqueName(e){let t=Ze.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(a){return n[We.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return wp(c,a,t)})}let o=[];for(let a=0,c=e.length;a<c;a++){let l=e[a],h=Iv(l),u=i[h];if(u)o.push(u.promise);else{let f;l.extensions&&l.extensions[We.KHR_DRACO_MESH_COMPRESSION]?f=r(l):f=wp(new Pt,l,t),i[h]={primitive:l,promise:f},o.push(f)}}return Promise.all(o)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){let h=o[c].material===void 0?Av(this.cache):this.getDependency("material",o[c].material);a.push(h)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){let l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let d=0,m=h.length;d<m;d++){let _=h[d],g=o[d],p,b=l[d];if(g.mode===Tn.TRIANGLES||g.mode===Tn.TRIANGLE_STRIP||g.mode===Tn.TRIANGLE_FAN||g.mode===void 0)p=r.isSkinnedMesh===!0?new Fr(_,b):new pt(_,b),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),g.mode===Tn.TRIANGLE_STRIP?p.geometry=Rh(p.geometry,xo):g.mode===Tn.TRIANGLE_FAN&&(p.geometry=Rh(p.geometry,rr));else if(g.mode===Tn.LINES)p=new Hr(_,b);else if(g.mode===Tn.LINE_STRIP)p=new ns(_,b);else if(g.mode===Tn.LINE_LOOP)p=new Vr(_,b);else if(g.mode===Tn.POINTS)p=new is(_,b);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(p.geometry.morphAttributes).length>0&&Cv(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),Zn(p,r),g.extensions&&ms(i,p,g),t.assignFinalMaterial(p),u.push(p)}for(let d=0,m=u.length;d<m;d++)t.associations.set(u[d],{meshes:e,primitives:d});if(u.length===1)return r.extensions&&ms(i,u[0],r),u[0];let f=new Rt;r.extensions&&ms(i,f,r),t.associations.set(f,{meshes:e});for(let d=0,m=u.length;d<m;d++)f.add(u[d]);return f})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Tt(nn.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new fi(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Zn(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){let r=i.pop(),o=i,a=[],c=[];for(let l=0,h=o.length;l<h;l++){let u=o[l];if(u){a.push(u);let f=new Ce;r!==null&&f.fromArray(r.array,l*16),c.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new kr(a,c)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,o=[],a=[],c=[],l=[],h=[];for(let u=0,f=i.channels.length;u<f;u++){let d=i.channels[u],m=i.samplers[d.sampler],_=d.target,g=_.node,p=i.parameters!==void 0?i.parameters[m.input]:m.input,b=i.parameters!==void 0?i.parameters[m.output]:m.output;_.node!==void 0&&(o.push(this.getDependency("node",g)),a.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",b)),l.push(m),h.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){let f=u[0],d=u[1],m=u[2],_=u[3],g=u[4],p=[];for(let v=0,x=f.length;v<x;v++){let S=f[v],T=d[v],C=m[v],N=_[v],E=g[v];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();let w=n._createAnimationTracks(S,T,C,N,E);if(w)for(let P=0;P<w.length;P++)p.push(w[P])}let b=new so(r,void 0,p);return Zn(b,i),b})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){let o=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=i.weights.length;c<l;c++)a.morphTargetInfluences[c]=i.weights[c]}),o})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=i.children||[];for(let l=0,h=a.length;l<h;l++)o.push(n.getDependency("node",a[l]));let c=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){let h=l[0],u=l[1],f=l[2];f!==null&&h.traverse(function(d){d.isSkinnedMesh&&d.bind(f,Lv)});for(let d=0,m=u.length;d<m;d++)h.add(u[d]);return h})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?i.createUniqueName(r.name):"",a=[],c=i._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(i.getDependency("camera",r.camera).then(function(l){return i._getNodeRef(i.cameraCache,r.camera,l)})),i._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let h;if(r.isBone===!0?h=new Ys:l.length>1?h=new Rt:l.length===1?h=l[0]:h=new ut,h!==l[0])for(let u=0,f=l.length;u<f;u++)h.add(l[u]);if(r.name&&(h.userData.name=r.name,h.name=o),Zn(h,r),r.extensions&&ms(n,h,r),r.matrix!==void 0){let u=new Ce;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!i.associations.has(h))i.associations.set(h,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){let u=i.associations.get(h);i.associations.set(h,{...u})}return i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new Rt;n.name&&(r.name=i.createUniqueName(n.name)),Zn(r,n),n.extensions&&ms(t,r,n);let o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(i.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let h=0,u=c.length;h<u;h++)r.add(c[h]);let l=h=>{let u=new Map;for(let[f,d]of i.associations)(f instanceof ln||f instanceof Et)&&u.set(f,d);return h.traverse(f=>{let d=i.associations.get(f);d!=null&&u.set(f,d)}),u};return i.associations=l(r),r})}_createAnimationTracks(e,t,n,i,r){let o=[],a=e.name?e.name:e.uuid,c=[];zi[r.path]===zi.weights?e.traverse(function(f){f.morphTargetInfluences&&c.push(f.name?f.name:f.uuid)}):c.push(a);let l;switch(zi[r.path]){case zi.weights:l=Xn;break;case zi.rotation:l=Yn;break;case zi.translation:case zi.scale:l=qn;break;default:switch(n.itemSize){case 1:l=Xn;break;case 2:case 3:default:l=qn;break}break}let h=i.interpolation!==void 0?Ev[i.interpolation]:ai,u=this._getArrayFromAccessor(n);for(let f=0,d=c.length;f<d;f++){let m=new l(c[f]+"."+zi[r.path],t.array,u,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),o.push(m)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=nu(t.constructor),i=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let i=this instanceof Yn?eu:Uc;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function Dv(s,e,t){let n=e.attributes,i=new Jt;if(n.POSITION!==void 0){let a=t.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(i.set(new R(c[0],c[1],c[2]),new R(l[0],l[1],l[2])),a.normalized){let h=nu(hr[a.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new R,c=new R;for(let l=0,h=r.length;l<h;l++){let u=r[l];if(u.POSITION!==void 0){let f=t.json.accessors[u.POSITION],d=f.min,m=f.max;if(d!==void 0&&m!==void 0){if(c.setX(Math.max(Math.abs(d[0]),Math.abs(m[0]))),c.setY(Math.max(Math.abs(d[1]),Math.abs(m[1]))),c.setZ(Math.max(Math.abs(d[2]),Math.abs(m[2]))),f.normalized){let _=nu(hr[f.componentType]);c.multiplyScalar(_)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}s.boundingBox=i;let o=new cn;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=o}function wp(s,e,t){let n=e.attributes,i=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){s.setAttribute(a,c)})}for(let o in n){let a=tu[o]||o.toLowerCase();a in s.attributes||i.push(r(n[o],a))}if(e.indices!==void 0&&!s.index){let o=t.getDependency("accessor",e.indices).then(function(a){s.setIndex(a)});i.push(o)}return qe.workingColorSpace!==Ht&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${qe.workingColorSpace}" not supported.`),Zn(s,e),Dv(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?Rv(s,e.targets,t):s})}var Ep={type:"change"},ru={type:"start"},Rp={type:"end"},Oc=new ci,Ap=new an,Nv=Math.cos(70*nn.DEG2RAD),Nt=new R,un=2*Math.PI,ot={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},su=1e-6,Fc=class extends ho{constructor(e,t=null){super(e,t),this.state=ot.NONE,this.target=new R,this.cursor=new R,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Oi.ROTATE,MIDDLE:Oi.DOLLY,RIGHT:Oi.PAN},this.touches={ONE:Fi.ROTATE,TWO:Fi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new R,this._lastQuaternion=new Vt,this._lastTargetPosition=new R,this._quat=new Vt().setFromUnitVectors(e.up,new R(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Qs,this._sphericalDelta=new Qs,this._scale=1,this._panOffset=new R,this._rotateStart=new re,this._rotateEnd=new re,this._rotateDelta=new re,this._panStart=new re,this._panEnd=new re,this._panDelta=new re,this._dollyStart=new re,this._dollyEnd=new re,this._dollyDelta=new re,this._dollyDirection=new R,this._mouse=new re,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Ov.bind(this),this._onPointerDown=Uv.bind(this),this._onPointerUp=Fv.bind(this),this._onContextMenu=Wv.bind(this),this._onMouseWheel=zv.bind(this),this._onKeyDown=Hv.bind(this),this._onTouchStart=Vv.bind(this),this._onTouchMove=Gv.bind(this),this._onMouseDown=Bv.bind(this),this._onMouseMove=kv.bind(this),this._interceptControlDown=Xv.bind(this),this._interceptControlUp=Yv.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Ep),this.update(),this.state=ot.NONE}update(e=null){let t=this.object.position;Nt.copy(t).sub(this.target),Nt.applyQuaternion(this._quat),this._spherical.setFromVector3(Nt),this.autoRotate&&this.state===ot.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=un:n>Math.PI&&(n-=un),i<-Math.PI?i+=un:i>Math.PI&&(i-=un),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Nt.setFromSpherical(this._spherical),Nt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Nt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Nt.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new R(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new R(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Nt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Oc.origin.copy(this.object.position),Oc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Oc.direction))<Nv?this.object.lookAt(this.target):(Ap.setFromNormalAndCoplanarPoint(this.object.up,this.target),Oc.intersectPlane(Ap,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>su||8*(1-this._lastQuaternion.dot(this.object.quaternion))>su||this._lastTargetPosition.distanceToSquared(this.target)>su?(this.dispatchEvent(Ep),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?un/60*this.autoRotateSpeed*e:un/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Nt.setFromMatrixColumn(t,0),Nt.multiplyScalar(-e),this._panOffset.add(Nt)}_panUp(e,t){this.screenSpacePanning===!0?Nt.setFromMatrixColumn(t,1):(Nt.setFromMatrixColumn(t,0),Nt.crossVectors(this.object.up,Nt)),Nt.multiplyScalar(e),this._panOffset.add(Nt)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Nt.copy(i).sub(this.target);let r=Nt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=i/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(un*this._rotateDelta.x/t.clientHeight),this._rotateUp(un*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(un*this._rotateDelta.x/t.clientHeight),this._rotateUp(un*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new re,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Uv(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s)))}function Ov(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function Fv(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Rp),this.state=ot.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Bv(s){let e;switch(s.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Oi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=ot.DOLLY;break;case Oi.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=ot.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=ot.ROTATE}break;case Oi.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=ot.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=ot.PAN}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(ru)}function kv(s){switch(this.state){case ot.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case ot.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case ot.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function zv(s){this.enabled===!1||this.enableZoom===!1||this.state!==ot.NONE||(s.preventDefault(),this.dispatchEvent(ru),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(Rp))}function Hv(s){this.enabled!==!1&&this._handleKeyDown(s)}function Vv(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case Fi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(s),this.state=ot.TOUCH_ROTATE;break;case Fi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(s),this.state=ot.TOUCH_PAN;break;default:this.state=ot.NONE}break;case 2:switch(this.touches.TWO){case Fi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=ot.TOUCH_DOLLY_PAN;break;case Fi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=ot.TOUCH_DOLLY_ROTATE;break;default:this.state=ot.NONE}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(ru)}function Gv(s){switch(this._trackPointer(s),this.state){case ot.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case ot.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case ot.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case ot.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=ot.NONE}}function Wv(s){this.enabled!==!1&&s.preventDefault()}function Xv(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Yv(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Cp={low:{pointLights:6,spotLights:2,shadows:!1,pixelRatio:1,particles:0,softShadows:!1,shadowMap:512},medium:{pointLights:12,spotLights:3,shadows:!0,pixelRatio:1.5,particles:900,softShadows:!1,shadowMap:1024},high:{pointLights:20,spotLights:4,shadows:!0,pixelRatio:2,particles:1800,softShadows:!0,shadowMap:2048}},qv=3.4,$v=.5;function bo(s){return new we().setRGB(s[0]/255,s[1]/255,s[2]/255,ct)}function Kv(){let e=document.createElement("canvas");e.width=e.height=32;let t=e.getContext("2d"),n=t.createRadialGradient(32/2,32/2,0,32/2,32/2,32/2);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.45,"rgba(255,255,255,0.55)"),n.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=n,t.fillRect(0,0,32,32);let i=new Gr(e);return i.colorSpace=ct,i}var Bc=class{constructor({pack:e,quality:t="medium",interactive:n=!0,showWeather:i=!0,onError:r=()=>{}}){this.pack=e,this.quality=Cp[t]||Cp.medium,this.interactive=n,this.showWeather=i,this.onError=r,this.disposed=!1,this.ready=!1,this.fixtureNodes=new Map,this.coverMeshes=new Map,this.emissiveOriginals=new Map,this.lastKey=null,this.snapshot=null,this.canvas=document.createElement("canvas"),this.canvas.className="domoview-canvas"}async init(e){this.container=e,e.append(this.canvas);try{this.renderer=new Lc({canvas:this.canvas,antialias:!0,alpha:!0,powerPreference:"high-performance"})}catch(t){throw new Error(`WebGL unavailable: ${t.message}`)}return this.renderer.setPixelRatio(Math.min(this.quality.pixelRatio,window.devicePixelRatio||1)),this.renderer.outputColorSpace=ct,this.renderer.toneMapping=Wa,this.renderer.toneMappingExposure=this.pack.model.exposure,this.renderer.shadowMap.enabled=this.quality.shadows,this.quality.shadows&&(this.renderer.shadowMap.type=Oa),this.renderer.localClippingEnabled=!0,this.scene=new On,ut.DEFAULT_UP.set(0,0,1),this.scene.up.set(0,0,1),this.buildCamera(),this.buildStaticLights(),this.buildLightPools(),await this.loadModel(),this.buildCovers(),this.showWeather&&this.quality.particles&&this.buildWeather(),this.ready=!0,this.resize(),this}buildCamera(){let e=this.pack.model.bounds;this.box=new Jt(new R(...e.min),new R(...e.max)),this.radius=this.box.getSize(new R).length()/2||5;let t=this.pack.cameras.find(n=>n.default)||this.pack.cameras[0];this.camera=t.type==="perspective"?new Tt(t.fov,1,this.radius/100,this.radius*20):new fi(-1,1,1,-1,-this.radius*10,this.radius*20),this.camera.up.set(0,0,1),this.scene.add(this.camera),this.controls=new Fc(this.camera,this.canvas),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.enablePan=!1,this.controls.minPolarAngle=.08,this.controls.maxPolarAngle=Math.PI/2-.02,this.controls.enabled=this.interactive,this.controls.addEventListener("change",()=>this.requestFrame()),this.clipPlane=new an(new R(0,0,-1),0),this.setCamera(t.id)}computeFit(e){let t=(e.azimuth-this.pack.meta.north)*xi,n=e.elevation*xi,r=new R(Math.sin(t)*Math.cos(n),Math.cos(t)*Math.cos(n),Math.sin(n)).clone().negate().normalize(),o=new R().crossVectors(r,new R(0,0,1)).normalize(),a=new R().crossVectors(o,r).normalize(),c=new R(...e.target),{min:l,max:h}=this.pack.model.bounds,u=e.clip?.above!=null?Math.min(h[2],e.clip.above):h[2],f=0,d=0,m=new R;for(let _ of[l[0],h[0]])for(let g of[l[1],h[1]])for(let p of[l[2],u])m.set(_,g,p).sub(c),f=Math.max(f,Math.abs(m.dot(o))),d=Math.max(d,Math.abs(m.dot(a)));return{halfWidth:f||this.radius,halfHeight:d||this.radius,aspect:(f||1)/(d||1)}}get preferredAspect(){return this.fit?.aspect??1}setCamera(e){let t=this.pack.cameras.find(l=>l.id===e)||this.pack.cameras.find(l=>l.default)||this.pack.cameras[0];this.cameraDefinition=t;let n=new R(...t.target),i=(t.azimuth-this.pack.meta.north)*xi,r=t.elevation*xi,o=this.radius*2.6,a=new R(n.x+Math.sin(i)*Math.cos(r)*o,n.y+Math.cos(i)*Math.cos(r)*o,n.z+Math.sin(r)*o);this.camera.position.copy(a),this.controls.target.copy(n),this.zoom=t.zoom,this.fit=this.computeFit(t);let c=t.clip?.above!=null;this.clipPlane.constant=c?t.clip.above:0,this.renderer.clippingPlanes=c?[this.clipPlane]:[],this.controls.update(),this.resize(),this.requestFrame()}resetView(){this.setCamera(this.cameraDefinition?.id)}resize(){if(!this.container||!this.renderer)return;let e=Math.max(1,this.container.clientWidth),t=Math.max(1,this.container.clientHeight||e);this.renderer.setSize(e,t,!1);let n=e/t;if(this.camera.isOrthographicCamera){let i=1.06/(this.zoom||1),r=(this.fit?.halfWidth??this.radius)*i,o=(this.fit?.halfHeight??this.radius)*i,a=Math.max(o,r/n),c=a*n;this.camera.left=-c,this.camera.right=c,this.camera.top=a,this.camera.bottom=-a}else this.camera.aspect=n;this.camera.updateProjectionMatrix(),this.requestFrame()}buildStaticLights(){let e=this.pack.model.environment;if(this.sunLight=new Ui(16777215,0),this.sunLight.castShadow=this.quality.shadows,this.quality.shadows){let t=this.sunLight.shadow;t.mapSize.setScalar(this.quality.shadowMap),t.bias=-8e-4,t.normalBias=.02;let n=this.radius*1.3;Object.assign(t.camera,{left:-n,right:n,top:n,bottom:-n,near:.1,far:this.radius*8}),t.camera.updateProjectionMatrix()}this.scene.add(this.sunLight,this.sunLight.target),this.moonLight=new Ui(16777215,0),this.scene.add(this.moonLight,this.moonLight.target),this.skyLight=new oo(14674687,bo(e.groundColor).getHex(),0),this.scene.add(this.skyLight),this.fillLight=new co(16777215,e.nightAmbient),this.scene.add(this.fillLight)}buildLightPools(){this.pointPool=[];for(let e=0;e<this.quality.pointLights;e++){let t=new as(16777215,0,8,2);t.visible=!1,this.scene.add(t),this.pointPool.push(t)}this.spotPool=[];for(let e=0;e<this.quality.spotLights;e++){let t=new os(16777215,0,10,.6,.4,2);t.visible=!1,this.scene.add(t,t.target),this.spotPool.push(t)}this.shadowBudget=this.quality.shadows?2:0}async loadModel(){let e=new Nc,t=await new Promise((i,r)=>{e.load(this.pack.model.url,i,void 0,o=>r(new Error(o?.message||`cannot load ${this.pack.model.url}`)))});this.modelRoot=new Rt,this.pack.model.up==="Y"&&(this.modelRoot.rotation.x=Math.PI/2),this.modelRoot.add(t.scene),this.scene.add(this.modelRoot);let n=new Map;t.scene.traverse(i=>{if(i.name&&n.set(i.name,i),!!i.isMesh){i.castShadow=this.quality.shadows,i.receiveShadow=this.quality.shadows;for(let r of[].concat(i.material))r&&(r.shadowSide=At)}}),this.nodesByName=n;for(let i of this.pack.fixtures){let r=i.render.emissiveNodes.map(o=>n.get(o)).filter(Boolean);r.length&&this.fixtureNodes.set(i.id,r);for(let o of r)o.traverse(a=>{if(a.isMesh)for(let c of[].concat(a.material))!c||this.emissiveOriginals.has(c)||this.emissiveOriginals.set(c,{emissive:c.emissive?.clone(),intensity:c.emissiveIntensity??1})})}(!this.pack.model.bounds||!Number.isFinite(this.pack.model.bounds.min[0]))&&(this.box.setFromObject(this.modelRoot),this.radius=this.box.getSize(new R).length()/2||5)}buildCovers(){this.coverGroup=new Rt,this.scene.add(this.coverGroup);let e=new Qt({color:9147032,roughness:.85,metalness:0,side:At});this.coverMaterial=e;for(let t of this.pack.openings){if(!t.cover.supported||!t.origin||!t.tangent)continue;let n=new Pt;n.setAttribute("position",new Ke(new Float32Array(12),3)),n.setAttribute("normal",new Ke(new Float32Array(12),3)),n.setIndex([0,1,2,0,2,3]);let i=new pt(n,e);i.castShadow=this.quality.shadows,i.visible=!1,i.userData.opening=t,this.coverGroup.add(i),this.coverMeshes.set(t.id,i)}}updateCovers(e){for(let[t,n]of this.coverMeshes){let i=n.userData.opening,r=e[t];if(!r){n.visible=!1;continue}let o=sd(i,r.position),a=i.levelElevation+i.head;if(o>=a-.005){n.visible=!1;continue}let c=i.cover.inFront?.035:-.02,[l,h]=i.normal||[0,1],u=i.origin[0]+l*c,f=i.origin[1]+h*c,[d,m]=i.tangent,_=[u+d*i.start,f+m*i.start],g=[u+d*i.end,f+m*i.end],p=n.geometry.attributes.position;p.setXYZ(0,_[0],_[1],o),p.setXYZ(1,g[0],g[1],o),p.setXYZ(2,g[0],g[1],a),p.setXYZ(3,_[0],_[1],a),p.needsUpdate=!0;let b=n.geometry.attributes.normal;for(let x=0;x<4;x++)b.setXYZ(x,l,h,0);b.needsUpdate=!0,n.geometry.computeBoundingSphere();let v=Zc(i,r.position,r.tilt);n.material=v>.01?this.slatMaterial(v):this.coverMaterial,n.visible=!0}}slatMaterial(e){this.slatMaterials||=new Map;let t=Math.round(ke(e,0,1)*10)/10;return this.slatMaterials.has(t)||this.slatMaterials.set(t,new Qt({color:9147032,roughness:.85,metalness:0,side:At,transparent:!0,opacity:ke(1-t*.55,.3,1)})),this.slatMaterials.get(t)}buildWeather(){let e=this.pack.rooms.filter(o=>o.outdoor&&o.polygon);this.weatherPolygons=e.map(o=>o.polygon);let t=this.quality.particles,n=new Float32Array(t*3),i=new Float32Array(t);for(let o=0;o<t;o++)i[o]=Math.random(),this.seedParticle(n,o);let r=new Pt;r.setAttribute("position",new Ke(n,3)),this.weatherSeeds=i,this.weatherPoints=new is(r,new Di({size:.05,map:Kv(),transparent:!0,depthWrite:!1,blending:uo,opacity:0,sizeAttenuation:!0})),this.weatherPoints.visible=!1,this.scene.add(this.weatherPoints)}seedParticle(e,t){let n=this.pack.model.bounds,i,r;if(this.weatherPolygons?.length){let o=this.weatherPolygons[t%this.weatherPolygons.length],a=0;do i=nn.lerp(n.min[0],n.max[0],Math.random()),r=nn.lerp(n.min[1],n.max[1],Math.random());while(!Xi(i,r,o)&&++a<12)}else i=nn.lerp(n.min[0],n.max[0],Math.random()),r=nn.lerp(n.min[1],n.max[1],Math.random());e[t*3]=i,e[t*3+1]=r,e[t*3+2]=nn.lerp(n.min[2],n.max[2]+1.5,Math.random())}updateWeather(e,t){if(!this.weatherPoints)return;let n=Math.max(t.rain,t.snow);if(this.weatherPoints.visible=n>.01,!this.weatherPoints.visible)return;let i=t.snow>t.rain,r=this.weatherPoints.material;r.opacity=ke(.25+n*.5,0,.8),r.size=i?.055:.03;let o=this.weatherPoints.geometry.attributes.position,a=o.array,c=(i?.9:7)*(.4+n),l=t.wind*(i?1.2:2.2),h=this.pack.model.bounds.min[2],u=a.length/3;for(let f=0;f<u;f++){let d=f*3;a[d+2]-=c*e,a[d]+=l*e*(.5+this.weatherSeeds[f]),i&&(a[d+1]+=Math.sin(this.weatherSeeds[f]*12+performance.now()/900)*e*.3),a[d+2]<h&&this.seedParticle(a,f)}o.needsUpdate=!0}apply(e){this.ready&&(this.snapshot=e,this.applySky(e),this.applyFixtures(e),this.updateCovers(e.covers),this.requestFrame())}applySky(e){let{sun:t,moon:n,daylight:i,direct:r,moonStrength:o}=e,a=this.pack.meta.north,c=(u,f,d)=>{let m=(f-a)*xi,_=d*xi,g=this.radius*4;u.position.set(Math.sin(m)*Math.cos(_)*g,Math.cos(m)*Math.cos(_)*g,Math.sin(_)*g).add(new R(...this.pack.model.center)),u.target.position.set(...this.pack.model.center),u.target.updateMatrixWorld()};c(this.sunLight,t.azimuth,t.elevation),this.sunLight.intensity=t.elevation>0?r*qv:0,this.sunLight.color=bo(e.sunColor),this.sunLight.visible=this.sunLight.intensity>.001,this.sunLight.castShadow&&(this.sunLight.castShadow=this.sunLight.visible),c(this.moonLight,n.azimuth,n.elevation),this.moonLight.intensity=n.elevation>0?o*$v:0,this.moonLight.color=bo(e.moonColor),this.moonLight.visible=this.moonLight.intensity>.001;let l=this.pack.model.environment.skyIntensity;this.skyLight.intensity=(.08+i*1.15)*l,this.fillLight.intensity=this.pack.model.environment.nightAmbient*(1.6-i);let h=.02+i*.06;this.scene.background=null,this.renderer.setClearColor(new we(h,h*1.08,h*1.2),0)}applyFixtures(e){let t=[];for(let o of e.emitters){let a=o.fixture;this.setEmissive(a,o);let c=a.emitters.reduce((l,h)=>l+(h.intensity||1),0)||1;for(let l of a.emitters)l.type!=="emissive"&&t.push({fixture:a,emitter:l,active:o,weight:(l.intensity||1)/c,priority:o.level*(l.intensity||1)*(a.light.lumens||600)})}for(let o of this.pack.fixtures)e.emitters.some(a=>a.fixture.id===o.id)||this.setEmissive(o,null);t.sort((o,a)=>a.priority-o.priority);let n=0,i=0,r=this.shadowBudget;for(let o of t){let{fixture:a,emitter:c,active:l,weight:h}=o,f=c.type==="spot"&&i<this.spotPool.length?this.spotPool[i++]:n<this.pointPool.length?this.pointPool[n++]:null;if(!f)break;let d=(a.light.lumens||600)*h*l.level;if(f.intensity=d/(4*Math.PI)*.06,f.color=bo(l.color),f.distance=a.light.range,f.position.set(...c.position),f.visible=f.intensity>5e-4,f.isSpotLight){f.angle=(c.angle??40)*xi,f.penumbra=c.penumbra;let _=c.target||[c.position[0],c.position[1],c.position[2]-2];f.target.position.set(..._),f.target.updateMatrixWorld()}a.light.shadow&&r>0&&this.quality.shadows?(r--,f.castShadow||(f.castShadow=!0,f.shadow.mapSize.setScalar(Math.min(1024,this.quality.shadowMap)),f.shadow.bias=-.002,f.shadow.normalBias=.03)):f.castShadow&&(f.castShadow=!1)}for(let o=n;o<this.pointPool.length;o++)this.pointPool[o].visible=!1,this.pointPool[o].intensity=0;for(let o=i;o<this.spotPool.length;o++)this.spotPool[o].visible=!1,this.spotPool[o].intensity=0}setEmissive(e,t){let n=this.fixtureNodes.get(e.id);if(n)for(let i of n)i.traverse(r=>{if(r.isMesh)for(let o of[].concat(r.material)){let a=o&&this.emissiveOriginals.get(o);if(a){if(!t){a.emissive&&o.emissive.copy(a.emissive),o.emissiveIntensity=a.intensity;continue}o.emissive=bo(t.color),o.emissiveIntensity=.4+t.level*2.6}}})}project(e){if(!this.camera)return null;let t=new R(...e).project(this.camera);return t.z>1||t.z<-1?null:[(t.x+1)/2*100,(1-t.y)/2*100]}fixtureAnchor(e){if(e.emitters.length)return e.emitters.reduce((i,r)=>i.map((o,a)=>o+r.position[a]),[0,0,0]).map(i=>i/e.emitters.length);let t=this.fixtureNodes.get(e.id);return t?.length?t[0].getWorldPosition(new R).toArray():null}fixtureScreen(e){let t=this.fixtureAnchor(e);return t?this.project(t):null}roomScreen(e){if(!e.label)return null;let t=this.pack.levels.find(n=>n.id===e.level);return this.project([e.label[0],e.label[1],(t?.elevation??0)+1.1])}openingScreen(e){if(!e.origin)return null;let t=(e.start+e.end)/2;return this.project([e.origin[0]+e.tangent[0]*t,e.origin[1]+e.tangent[1]*t,e.levelElevation+e.head])}requestFrame(){this.disposed||this.frame||(this.frame=requestAnimationFrame(e=>this.draw(e)))}draw(e){if(this.frame=null,this.disposed||!this.ready)return;let t=Math.min(.1,(e-(this.lastTime||e))/1e3);this.lastTime=e;let n=this.controls.update(),i=this.snapshot?.weather,r=!!i&&Math.max(i.rain,i.snow)>.01;r&&!document.hidden&&this.updateWeather(t,i),this.renderer.render(this.scene,this.camera),this.onFrame?.(),(n||r&&!document.hidden)&&this.requestFrame()}setInteractive(e){this.interactive=e,this.controls&&(this.controls.enabled=e)}dispose(){this.disposed=!0,this.frame&&cancelAnimationFrame(this.frame),this.controls?.dispose(),this.scene?.traverse(e=>{if(e.isMesh||e.isPoints){e.geometry?.dispose();for(let t of[].concat(e.material))t?.map?.dispose(),t?.dispose()}}),this.renderer?.dispose(),this.canvas.remove()}};var jv="domoview-studio";function gs(s,{version:e="0.1.0",modelFile:t="model.glb"}={}){let n=new yi(s),i=$c(s),r=s.level,o=new Set,a=(p,b)=>{let v=Bt(p||b,b),x=2;for(;o.has(v);)v=`${Bt(p||b,b)}_${x++}`;return o.add(v),v},c=new Map,l=s.rooms.map((p,b)=>{let v=a(p.name,`room_${b+1}`);return c.set(p.id,v),{id:v,name:p.name,level:"ground",polygon:n.polygon(p.polygon),outdoor:p.outdoor||void 0}}),h=new Map,u=s.walls.map((p,b)=>{let v=`w${b+1}`;return h.set(p.id,v),{id:v,a:n.point(p.a),b:n.point(p.b),thickness:p.thickness,height:p.height,exterior:p.exterior||void 0,flip:p.flip||void 0}}),f=s.openings.map((p,b)=>{let v=s.walls.find(T=>T.id===p.wall);if(!v)return null;let S={id:a(p.name,`${p.type}_${b+1}`),type:p.type,name:p.name||Zv(p,s,b),wall:h.get(v.id),offset:n.length(p.offset),width:p.width,sill:p.sill,head:p.head,rooms:p.rooms.map(T=>c.get(T)).filter(Boolean)};return p.mullion!=null&&(S.mullion=p.mullion),p.cover&&p.type!=="door"&&(S.cover={profile:p.coverProfile||"venetian"},p.coverInFront&&(S.cover.inFront=!0)),p.type!=="door"&&(S.glass=Jv(p,v,n)),S}).filter(Boolean),d=s.fixtures.map((p,b)=>{let v=a(p.name,`${p.kind}_${b+1}`);return{id:v,name:p.name||`Fixture ${b+1}`,kind:p.kind,room:c.get(p.room)||void 0,node:`dv_light_${v}`,emitters:p.emitters.map(x=>{let[S,T]=n.point(x.point),C={position:[S,T,Kt(x.height)],type:x.type||"point"};return x.intensity!=null&&x.intensity!==1&&(C.intensity=x.intensity),x.type==="spot"&&(C.angle=x.angle??40,C.target=[S,T,Kt(r.elevation)]),C}),light:{color:mr(p.color),lumens:p.lumens,range:p.range,shadow:p.shadow||void 0},dimmable:p.kind==="light"||void 0,render:{bulb:p.bulb||"glow"},variant:p.variant||void 0}}),m=s.furniture.filter(p=>p.occluder).map((p,b)=>{let v=p.rect.map(T=>n.point(T)),x=v.map(T=>T[0]),S=v.map(T=>T[1]);return{name:Bt(p.name,`furniture_${b+1}`),min:[Kt(Math.min(...x)),Kt(Math.min(...S)),Kt(p.base)],max:[Kt(Math.max(...x)),Kt(Math.max(...S)),Kt(p.top)]}}),_=i?{min:[...n.point([i.min[0],i.max[1]]),Kt(r.elevation-.25)],max:[...n.point([i.max[0],i.min[1]]),Kt(r.elevation+r.height+.15)]}:void 0,g={$schema:"https://raw.githubusercontent.com/tomjschr/interactive_floormap/main/schemas/home-pack-1.schema.json",pack:{schema:Oo,id:Bt(s.meta.id||s.meta.name,"home"),name:s.meta.name||"Home",version:s.meta.version||"1.0.0",author:s.meta.author||void 0,license:s.meta.license||void 0,description:s.meta.description||void 0,units:"m",north:s.meta.north||0,createdWith:`${jv} ${e}`},model:{url:t,up:"Y",bounds:_,environment:{groundColor:mr(s.materials.floor)}},cameras:[{id:"default",name:"Default view",type:"orthographic",azimuth:s.camera.azimuth,elevation:s.camera.elevation,zoom:s.camera.zoom,clip:s.camera.clipAbove>0?{above:s.camera.clipAbove}:void 0,default:!0}],levels:[{id:"ground",name:"Ground floor",elevation:r.elevation,height:r.height}],rooms:l,walls:u,openings:f,fixtures:d,occluders:m.length?m:void 0,bindings:{}};return ou(g)}function Zv(s,e,t){let n=e.rooms.find(r=>s.rooms.includes(r.id)),i=s.type==="door"?"Door":s.type==="glass_door"?"Glass door":"Window";return n?`${n.name} ${i.toLowerCase()}`:`${i} ${t+1}`}function Jv(s,e,t){let{tangent:n}=pr(e),i=t.point(e.a),r=t.length(s.offset),o=s.width/2,a=[i[0]+n[0]*(r-o),i[1]+n[1]*(r-o)],c=[i[0]+n[0]*(r+o),i[1]+n[1]*(r+o)],l=.02;return{min:[Kt(Math.min(a[0],c[0])-l),Kt(Math.min(a[1],c[1])-l),Kt(s.sill)],max:[Kt(Math.max(a[0],c[0])+l),Kt(Math.max(a[1],c[1])+l),Kt(s.head)]}}function Kt(s){let e=Math.round(s*1e4)/1e4;return e===0?0:e}function ou(s){return Array.isArray(s)?s.map(ou):s&&typeof s=="object"?Object.fromEntries(Object.entries(s).filter(([,e])=>e!==void 0).map(([e,t])=>[e,ou(t)])):s}var Ip={POSITION:["byte","byte normalized","unsigned byte","unsigned byte normalized","short","short normalized","unsigned short","unsigned short normalized"],NORMAL:["byte normalized","short normalized"],TANGENT:["byte normalized","short normalized"],TEXCOORD:["byte","byte normalized","unsigned byte","short","short normalized","unsigned short"]},_s=class{constructor(){this.textureUtils=null,this.pluginCallbacks=[],this.register(function(e){return new hu(e)}),this.register(function(e){return new uu(e)}),this.register(function(e){return new mu(e)}),this.register(function(e){return new gu(e)}),this.register(function(e){return new _u(e)}),this.register(function(e){return new xu(e)}),this.register(function(e){return new du(e)}),this.register(function(e){return new fu(e)}),this.register(function(e){return new pu(e)}),this.register(function(e){return new yu(e)}),this.register(function(e){return new vu(e)}),this.register(function(e){return new Mu(e)}),this.register(function(e){return new bu(e)}),this.register(function(e){return new Su(e)})}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}setTextureUtils(e){return this.textureUtils=e,this}parse(e,t,n,i){let r=new lu,o=[];for(let a=0,c=this.pluginCallbacks.length;a<c;a++)o.push(this.pluginCallbacks[a](r));r.setPlugins(o),r.setTextureUtils(this.textureUtils),r.writeAsync(e,t,i).catch(n)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,i,r,t)})}},Xe={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,INT:5124,UNSIGNED_INT:5125,FLOAT:5126,ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987,CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497},au="KHR_mesh_quantization",xn={};xn[It]=Xe.NEAREST;xn[er]=Xe.NEAREST_MIPMAP_NEAREST;xn[_i]=Xe.NEAREST_MIPMAP_LINEAR;xn[zt]=Xe.LINEAR;xn[Bi]=Xe.LINEAR_MIPMAP_NEAREST;xn[_n]=Xe.LINEAR_MIPMAP_LINEAR;xn[bn]=Xe.CLAMP_TO_EDGE;xn[Vn]=Xe.REPEAT;xn[Ii]=Xe.MIRRORED_REPEAT;var Pp={scale:"scale",position:"translation",quaternion:"rotation",morphTargetInfluences:"weights"},Qv=new we,Lp=12,eM=1179937895,tM=2,Dp=8,nM=1313821514,iM=5130562;function So(s,e){return s.length===e.length&&s.every(function(t,n){return t===e[n]})}function sM(s){return new TextEncoder().encode(s).buffer}function rM(s){return So(s.elements,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function oM(s,e,t){let n={min:new Array(s.itemSize).fill(Number.POSITIVE_INFINITY),max:new Array(s.itemSize).fill(Number.NEGATIVE_INFINITY)};for(let i=e;i<e+t;i++)for(let r=0;r<s.itemSize;r++){let o;s.itemSize>4?o=s.array[i*s.itemSize+r]:(r===0?o=s.getX(i):r===1?o=s.getY(i):r===2?o=s.getZ(i):r===3&&(o=s.getW(i)),s.normalized===!0&&(o=nn.normalize(o,s.array))),n.min[r]=Math.min(n.min[r],o),n.max[r]=Math.max(n.max[r],o)}return n}function Up(s){return Math.ceil(s/4)*4}function cu(s,e=0){let t=Up(s.byteLength);if(t!==s.byteLength){let n=new Uint8Array(t);if(n.set(new Uint8Array(s)),e!==0)for(let i=s.byteLength;i<t;i++)n[i]=e;return n.buffer}return s}function Np(){return typeof document>"u"&&typeof OffscreenCanvas<"u"?new OffscreenCanvas(1,1):document.createElement("canvas")}function aM(s,e){if(typeof OffscreenCanvas<"u"&&s instanceof OffscreenCanvas){let t;return e==="image/jpeg"?t=.92:e==="image/webp"&&(t=.8),s.convertToBlob({type:e,quality:t})}else return new Promise(t=>s.toBlob(t,e))}var lu=class{constructor(){this.plugins=[],this.options={},this.pending=[],this.buffers=[],this.byteOffset=0,this.buffers=[],this.nodeMap=new Map,this.skins=[],this.extensionsUsed={},this.extensionsRequired={},this.uids=new Map,this.uid=0,this.json={asset:{version:"2.0",generator:"THREE.GLTFExporter r180"}},this.cache={meshes:new Map,attributes:new Map,attributesNormalized:new Map,materials:new Map,textures:new Map,images:new Map},this.textureUtils=null}setPlugins(e){this.plugins=e}setTextureUtils(e){this.textureUtils=e}async writeAsync(e,t,n={}){this.options=Object.assign({binary:!1,trs:!1,onlyVisible:!0,maxTextureSize:1/0,animations:[],includeCustomExtensions:!1},n),this.options.animations.length>0&&(this.options.trs=!0),await this.processInputAsync(e),await Promise.all(this.pending);let i=this,r=i.buffers,o=i.json;n=i.options;let a=i.extensionsUsed,c=i.extensionsRequired,l=new Blob(r,{type:"application/octet-stream"}),h=Object.keys(a),u=Object.keys(c);if(h.length>0&&(o.extensionsUsed=h),u.length>0&&(o.extensionsRequired=u),o.buffers&&o.buffers.length>0&&(o.buffers[0].byteLength=l.size),n.binary===!0){let f=new FileReader;f.readAsArrayBuffer(l),f.onloadend=function(){let d=cu(f.result),m=new DataView(new ArrayBuffer(Dp));m.setUint32(0,d.byteLength,!0),m.setUint32(4,iM,!0);let _=cu(sM(JSON.stringify(o)),32),g=new DataView(new ArrayBuffer(Dp));g.setUint32(0,_.byteLength,!0),g.setUint32(4,nM,!0);let p=new ArrayBuffer(Lp),b=new DataView(p);b.setUint32(0,eM,!0),b.setUint32(4,tM,!0);let v=Lp+g.byteLength+_.byteLength+m.byteLength+d.byteLength;b.setUint32(8,v,!0);let x=new Blob([p,g,_,m,d],{type:"application/octet-stream"}),S=new FileReader;S.readAsArrayBuffer(x),S.onloadend=function(){t(S.result)}}}else if(o.buffers&&o.buffers.length>0){let f=new FileReader;f.readAsDataURL(l),f.onloadend=function(){let d=f.result;o.buffers[0].uri=d,t(o)}}else t(o)}serializeUserData(e,t){if(Object.keys(e.userData).length===0)return;let n=this.options,i=this.extensionsUsed;try{let r=JSON.parse(JSON.stringify(e.userData));if(n.includeCustomExtensions&&r.gltfExtensions){t.extensions===void 0&&(t.extensions={});for(let o in r.gltfExtensions)t.extensions[o]=r.gltfExtensions[o],i[o]=!0;delete r.gltfExtensions}Object.keys(r).length>0&&(t.extras=r)}catch(r){console.warn("THREE.GLTFExporter: userData of '"+e.name+"' won't be serialized because of JSON.stringify error - "+r.message)}}getUID(e,t=!1){if(this.uids.has(e)===!1){let i=new Map;i.set(!0,this.uid++),i.set(!1,this.uid++),this.uids.set(e,i)}return this.uids.get(e).get(t)}isNormalizedNormalAttribute(e){if(this.cache.attributesNormalized.has(e))return!1;let n=new R;for(let i=0,r=e.count;i<r;i++)if(Math.abs(n.fromBufferAttribute(e,i).length()-1)>5e-4)return!1;return!0}createNormalizedNormalAttribute(e){let t=this.cache;if(t.attributesNormalized.has(e))return t.attributesNormalized.get(e);let n=e.clone(),i=new R;for(let r=0,o=n.count;r<o;r++)i.fromBufferAttribute(n,r),i.x===0&&i.y===0&&i.z===0?i.setX(1):i.normalize(),n.setXYZ(r,i.x,i.y,i.z);return t.attributesNormalized.set(e,n),n}applyTextureTransform(e,t){let n=!1,i={};(t.offset.x!==0||t.offset.y!==0)&&(i.offset=t.offset.toArray(),n=!0),t.rotation!==0&&(i.rotation=t.rotation,n=!0),(t.repeat.x!==1||t.repeat.y!==1)&&(i.scale=t.repeat.toArray(),n=!0),n&&(e.extensions=e.extensions||{},e.extensions.KHR_texture_transform=i,this.extensionsUsed.KHR_texture_transform=!0)}async buildMetalRoughTextureAsync(e,t){if(e===t)return e;function n(d){return d.colorSpace===ct?function(_){return _<.04045?_*.0773993808:Math.pow(_*.9478672986+.0521327014,2.4)}:function(_){return _}}e instanceof ss&&(e=await this.decompressTextureAsync(e)),t instanceof ss&&(t=await this.decompressTextureAsync(t));let i=e?e.image:null,r=t?t.image:null,o=Math.max(i?i.width:0,r?r.width:0),a=Math.max(i?i.height:0,r?r.height:0),c=Np();c.width=o,c.height=a;let l=c.getContext("2d",{willReadFrequently:!0});l.fillStyle="#00ffff",l.fillRect(0,0,o,a);let h=l.getImageData(0,0,o,a);if(i){l.drawImage(i,0,0,o,a);let d=n(e),m=l.getImageData(0,0,o,a).data;for(let _=2;_<m.length;_+=4)h.data[_]=d(m[_]/256)*256}if(r){l.drawImage(r,0,0,o,a);let d=n(t),m=l.getImageData(0,0,o,a).data;for(let _=1;_<m.length;_+=4)h.data[_]=d(m[_]/256)*256}l.putImageData(h,0,0);let f=(e||t).clone();return f.source=new Pi(c),f.colorSpace=Bn,f.channel=(e||t).channel,e&&t&&e.channel!==t.channel&&console.warn("THREE.GLTFExporter: UV channels for metalnessMap and roughnessMap textures must match."),console.warn("THREE.GLTFExporter: Merged metalnessMap and roughnessMap textures."),f}async decompressTextureAsync(e,t=1/0){if(this.textureUtils===null)throw new Error("THREE.GLTFExporter: setTextureUtils() must be called to process compressed textures.");return await this.textureUtils.decompress(e,t)}processBuffer(e){let t=this.json,n=this.buffers;return t.buffers||(t.buffers=[{byteLength:0}]),n.push(e),0}processBufferView(e,t,n,i,r){let o=this.json;o.bufferViews||(o.bufferViews=[]);let a;switch(t){case Xe.BYTE:case Xe.UNSIGNED_BYTE:a=1;break;case Xe.SHORT:case Xe.UNSIGNED_SHORT:a=2;break;default:a=4}let c=e.itemSize*a;r===Xe.ARRAY_BUFFER&&(c=Math.ceil(c/4)*4);let l=Up(i*c),h=new DataView(new ArrayBuffer(l)),u=0;for(let m=n;m<n+i;m++){for(let _=0;_<e.itemSize;_++){let g;e.itemSize>4?g=e.array[m*e.itemSize+_]:(_===0?g=e.getX(m):_===1?g=e.getY(m):_===2?g=e.getZ(m):_===3&&(g=e.getW(m)),e.normalized===!0&&(g=nn.normalize(g,e.array))),t===Xe.FLOAT?h.setFloat32(u,g,!0):t===Xe.INT?h.setInt32(u,g,!0):t===Xe.UNSIGNED_INT?h.setUint32(u,g,!0):t===Xe.SHORT?h.setInt16(u,g,!0):t===Xe.UNSIGNED_SHORT?h.setUint16(u,g,!0):t===Xe.BYTE?h.setInt8(u,g):t===Xe.UNSIGNED_BYTE&&h.setUint8(u,g),u+=a}u%c!==0&&(u+=c-u%c)}let f={buffer:this.processBuffer(h.buffer),byteOffset:this.byteOffset,byteLength:l};return r!==void 0&&(f.target=r),r===Xe.ARRAY_BUFFER&&(f.byteStride=c),this.byteOffset+=l,o.bufferViews.push(f),{id:o.bufferViews.length-1,byteLength:0}}processBufferViewImage(e){let t=this,n=t.json;return n.bufferViews||(n.bufferViews=[]),new Promise(function(i){let r=new FileReader;r.readAsArrayBuffer(e),r.onloadend=function(){let o=cu(r.result),a={buffer:t.processBuffer(o),byteOffset:t.byteOffset,byteLength:o.byteLength};t.byteOffset+=o.byteLength,i(n.bufferViews.push(a)-1)}})}processAccessor(e,t,n,i){let r=this.json,o={1:"SCALAR",2:"VEC2",3:"VEC3",4:"VEC4",9:"MAT3",16:"MAT4"},a;if(e.array.constructor===Float32Array)a=Xe.FLOAT;else if(e.array.constructor===Int32Array)a=Xe.INT;else if(e.array.constructor===Uint32Array)a=Xe.UNSIGNED_INT;else if(e.array.constructor===Int16Array)a=Xe.SHORT;else if(e.array.constructor===Uint16Array)a=Xe.UNSIGNED_SHORT;else if(e.array.constructor===Int8Array)a=Xe.BYTE;else if(e.array.constructor===Uint8Array)a=Xe.UNSIGNED_BYTE;else throw new Error("THREE.GLTFExporter: Unsupported bufferAttribute component type: "+e.array.constructor.name);if(n===void 0&&(n=0),(i===void 0||i===1/0)&&(i=e.count),i===0)return null;let c=oM(e,n,i),l;t!==void 0&&(l=e===t.index?Xe.ELEMENT_ARRAY_BUFFER:Xe.ARRAY_BUFFER);let h=this.processBufferView(e,a,n,i,l),u={bufferView:h.id,byteOffset:h.byteOffset,componentType:a,count:i,max:c.max,min:c.min,type:o[e.itemSize]};return e.normalized===!0&&(u.normalized=!0),r.accessors||(r.accessors=[]),r.accessors.push(u)-1}processImage(e,t,n,i="image/png"){if(e!==null){let r=this,o=r.cache,a=r.json,c=r.options,l=r.pending;o.images.has(e)||o.images.set(e,{});let h=o.images.get(e),u=i+":flipY/"+n.toString();if(h[u]!==void 0)return h[u];a.images||(a.images=[]);let f={mimeType:i},d=Np();d.width=Math.min(e.width,c.maxTextureSize),d.height=Math.min(e.height,c.maxTextureSize);let m=d.getContext("2d",{willReadFrequently:!0});if(n===!0&&(m.translate(0,d.height),m.scale(1,-1)),e.data!==void 0){t!==tn&&console.error("GLTFExporter: Only RGBAFormat is supported.",t),(e.width>c.maxTextureSize||e.height>c.maxTextureSize)&&console.warn("GLTFExporter: Image size is bigger than maxTextureSize",e);let g=new Uint8ClampedArray(e.height*e.width*4);for(let p=0;p<g.length;p+=4)g[p+0]=e.data[p+0],g[p+1]=e.data[p+1],g[p+2]=e.data[p+2],g[p+3]=e.data[p+3];m.putImageData(new ImageData(g,e.width,e.height),0,0)}else if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap||typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas)m.drawImage(e,0,0,d.width,d.height);else throw new Error("THREE.GLTFExporter: Invalid image type. Use HTMLImageElement, HTMLCanvasElement, ImageBitmap or OffscreenCanvas.");c.binary===!0?l.push(aM(d,i).then(g=>r.processBufferViewImage(g)).then(g=>{f.bufferView=g})):f.uri=Vs.getDataURL(d,i);let _=a.images.push(f)-1;return h[u]=_,_}else throw new Error("THREE.GLTFExporter: No valid image data found. Unable to process texture.")}processSampler(e){let t=this.json;t.samplers||(t.samplers=[]);let n={magFilter:xn[e.magFilter],minFilter:xn[e.minFilter],wrapS:xn[e.wrapS],wrapT:xn[e.wrapT]};return t.samplers.push(n)-1}async processTextureAsync(e){let n=this.options,i=this.cache,r=this.json;if(i.textures.has(e))return i.textures.get(e);r.textures||(r.textures=[]),e instanceof ss&&(e=await this.decompressTextureAsync(e,n.maxTextureSize));let o=e.userData.mimeType;o==="image/webp"&&(o="image/png");let a={sampler:this.processSampler(e),source:this.processImage(e.image,e.format,e.flipY,o)};e.name&&(a.name=e.name),await this._invokeAllAsync(async function(l){l.writeTexture&&await l.writeTexture(e,a)});let c=r.textures.push(a)-1;return i.textures.set(e,c),c}async processMaterialAsync(e){let t=this.cache,n=this.json;if(t.materials.has(e))return t.materials.get(e);if(e.isShaderMaterial)return console.warn("GLTFExporter: THREE.ShaderMaterial not supported."),null;n.materials||(n.materials=[]);let i={pbrMetallicRoughness:{}};e.isMeshStandardMaterial!==!0&&e.isMeshBasicMaterial!==!0&&console.warn("GLTFExporter: Use MeshStandardMaterial or MeshBasicMaterial for best results.");let r=e.color.toArray().concat([e.opacity]);if(So(r,[1,1,1,1])||(i.pbrMetallicRoughness.baseColorFactor=r),e.isMeshStandardMaterial?(i.pbrMetallicRoughness.metallicFactor=e.metalness,i.pbrMetallicRoughness.roughnessFactor=e.roughness):(i.pbrMetallicRoughness.metallicFactor=0,i.pbrMetallicRoughness.roughnessFactor=1),e.metalnessMap||e.roughnessMap){let a=await this.buildMetalRoughTextureAsync(e.metalnessMap,e.roughnessMap),c={index:await this.processTextureAsync(a),texCoord:a.channel};this.applyTextureTransform(c,a),i.pbrMetallicRoughness.metallicRoughnessTexture=c}if(e.map){let a={index:await this.processTextureAsync(e.map),texCoord:e.map.channel};this.applyTextureTransform(a,e.map),i.pbrMetallicRoughness.baseColorTexture=a}if(e.emissive){let a=e.emissive;if(Math.max(a.r,a.g,a.b)>0&&(i.emissiveFactor=e.emissive.toArray()),e.emissiveMap){let l={index:await this.processTextureAsync(e.emissiveMap),texCoord:e.emissiveMap.channel};this.applyTextureTransform(l,e.emissiveMap),i.emissiveTexture=l}}if(e.normalMap){let a={index:await this.processTextureAsync(e.normalMap),texCoord:e.normalMap.channel};e.normalScale&&e.normalScale.x!==1&&(a.scale=e.normalScale.x),this.applyTextureTransform(a,e.normalMap),i.normalTexture=a}if(e.aoMap){let a={index:await this.processTextureAsync(e.aoMap),texCoord:e.aoMap.channel};e.aoMapIntensity!==1&&(a.strength=e.aoMapIntensity),this.applyTextureTransform(a,e.aoMap),i.occlusionTexture=a}e.transparent?i.alphaMode="BLEND":e.alphaTest>0&&(i.alphaMode="MASK",i.alphaCutoff=e.alphaTest),e.side===At&&(i.doubleSided=!0),e.name!==""&&(i.name=e.name),this.serializeUserData(e,i),await this._invokeAllAsync(async function(a){a.writeMaterialAsync&&await a.writeMaterialAsync(e,i)});let o=n.materials.push(i)-1;return t.materials.set(e,o),o}async processMeshAsync(e){let t=this.cache,n=this.json,i=[e.geometry.uuid];if(Array.isArray(e.material))for(let x=0,S=e.material.length;x<S;x++)i.push(e.material[x].uuid);else i.push(e.material.uuid);let r=i.join(":");if(t.meshes.has(r))return t.meshes.get(r);let o=e.geometry,a;e.isLineSegments?a=Xe.LINES:e.isLineLoop?a=Xe.LINE_LOOP:e.isLine?a=Xe.LINE_STRIP:e.isPoints?a=Xe.POINTS:a=e.material.wireframe?Xe.LINES:Xe.TRIANGLES;let c={},l={},h=[],u=[],f={uv:"TEXCOORD_0",uv1:"TEXCOORD_1",uv2:"TEXCOORD_2",uv3:"TEXCOORD_3",color:"COLOR_0",skinWeight:"WEIGHTS_0",skinIndex:"JOINTS_0"},d=o.getAttribute("normal");d!==void 0&&!this.isNormalizedNormalAttribute(d)&&(console.warn("THREE.GLTFExporter: Creating normalized normal attribute from the non-normalized one."),o.setAttribute("normal",this.createNormalizedNormalAttribute(d)));let m=null;for(let x in o.attributes){if(x.slice(0,5)==="morph")continue;let S=o.attributes[x];if(x=f[x]||x.toUpperCase(),/^(POSITION|NORMAL|TANGENT|TEXCOORD_\d+|COLOR_\d+|JOINTS_\d+|WEIGHTS_\d+)$/.test(x)||(x="_"+x),t.attributes.has(this.getUID(S))){l[x]=t.attributes.get(this.getUID(S));continue}m=null;let C=S.array;x==="JOINTS_0"&&!(C instanceof Uint16Array)&&!(C instanceof Uint8Array)?(console.warn('GLTFExporter: Attribute "skinIndex" converted to type UNSIGNED_SHORT.'),m=new Ke(new Uint16Array(C),S.itemSize,S.normalized)):(C instanceof Uint32Array||C instanceof Int32Array)&&!x.startsWith("_")&&(console.warn(`GLTFExporter: Attribute "${x}" converted to type FLOAT.`),m=_s.Utils.toFloat32BufferAttribute(S));let N=this.processAccessor(m||S,o);N!==null&&(x.startsWith("_")||this.detectMeshQuantization(x,S),l[x]=N,t.attributes.set(this.getUID(S),N))}if(d!==void 0&&o.setAttribute("normal",d),Object.keys(l).length===0)return null;if(e.morphTargetInfluences!==void 0&&e.morphTargetInfluences.length>0){let x=[],S=[],T={};if(e.morphTargetDictionary!==void 0)for(let C in e.morphTargetDictionary)T[e.morphTargetDictionary[C]]=C;for(let C=0;C<e.morphTargetInfluences.length;++C){let N={},E=!1;for(let w in o.morphAttributes){if(w!=="position"&&w!=="normal"){E||(console.warn("GLTFExporter: Only POSITION and NORMAL morph are supported."),E=!0);continue}let P=o.morphAttributes[w][C],k=w.toUpperCase(),z=o.attributes[w];if(t.attributes.has(this.getUID(P,!0))){N[k]=t.attributes.get(this.getUID(P,!0));continue}let X=P.clone();if(!o.morphTargetsRelative)for(let G=0,Y=P.count;G<Y;G++)for(let J=0;J<P.itemSize;J++)J===0&&X.setX(G,P.getX(G)-z.getX(G)),J===1&&X.setY(G,P.getY(G)-z.getY(G)),J===2&&X.setZ(G,P.getZ(G)-z.getZ(G)),J===3&&X.setW(G,P.getW(G)-z.getW(G));N[k]=this.processAccessor(X,o),t.attributes.set(this.getUID(z,!0),N[k])}u.push(N),x.push(e.morphTargetInfluences[C]),e.morphTargetDictionary!==void 0&&S.push(T[C])}c.weights=x,S.length>0&&(c.extras={},c.extras.targetNames=S)}let _=Array.isArray(e.material);if(_&&o.groups.length===0)return null;let g=!1;if(_&&o.index===null){let x=[];for(let S=0,T=o.attributes.position.count;S<T;S++)x[S]=S;o.setIndex(x),g=!0}let p=_?e.material:[e.material],b=_?o.groups:[{materialIndex:0,start:void 0,count:void 0}];for(let x=0,S=b.length;x<S;x++){let T={mode:a,attributes:l};if(this.serializeUserData(o,T),u.length>0&&(T.targets=u),o.index!==null){let N=this.getUID(o.index);(b[x].start!==void 0||b[x].count!==void 0)&&(N+=":"+b[x].start+":"+b[x].count),t.attributes.has(N)?T.indices=t.attributes.get(N):(T.indices=this.processAccessor(o.index,o,b[x].start,b[x].count),t.attributes.set(N,T.indices)),T.indices===null&&delete T.indices}let C=await this.processMaterialAsync(p[b[x].materialIndex]);C!==null&&(T.material=C),h.push(T)}g===!0&&o.setIndex(null),c.primitives=h,n.meshes||(n.meshes=[]),await this._invokeAllAsync(function(x){x.writeMesh&&x.writeMesh(e,c)});let v=n.meshes.push(c)-1;return t.meshes.set(r,v),v}detectMeshQuantization(e,t){if(this.extensionsUsed[au])return;let n;switch(t.array.constructor){case Int8Array:n="byte";break;case Uint8Array:n="unsigned byte";break;case Int16Array:n="short";break;case Uint16Array:n="unsigned short";break;default:return}t.normalized&&(n+=" normalized");let i=e.split("_",1)[0];Ip[i]&&Ip[i].includes(n)&&(this.extensionsUsed[au]=!0,this.extensionsRequired[au]=!0)}processCamera(e){let t=this.json;t.cameras||(t.cameras=[]);let n=e.isOrthographicCamera,i={type:n?"orthographic":"perspective"};return n?i.orthographic={xmag:e.right*2,ymag:e.top*2,zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near}:i.perspective={aspectRatio:e.aspect,yfov:nn.degToRad(e.fov),zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near},e.name!==""&&(i.name=e.type),t.cameras.push(i)-1}processAnimation(e,t){let n=this.json,i=this.nodeMap;n.animations||(n.animations=[]),e=_s.Utils.mergeMorphTargetTracks(e.clone(),t);let r=e.tracks,o=[],a=[];for(let l=0;l<r.length;++l){let h=r[l],u=Ze.parseTrackName(h.name),f=Ze.findNode(t,u.nodeName),d=Pp[u.propertyName];if(u.objectName==="bones"&&(f.isSkinnedMesh===!0?f=f.skeleton.getBoneByName(u.objectIndex):f=void 0),!f||!d){console.warn('THREE.GLTFExporter: Could not export animation track "%s".',h.name);continue}let m=1,_=h.values.length/h.times.length;d===Pp.morphTargetInfluences&&(_/=f.morphTargetInfluences.length);let g;h.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline===!0?(g="CUBICSPLINE",_/=3):h.getInterpolation()===oi?g="STEP":g="LINEAR",a.push({input:this.processAccessor(new Ke(h.times,m)),output:this.processAccessor(new Ke(h.values,_)),interpolation:g}),o.push({sampler:a.length-1,target:{node:i.get(f),path:d}})}let c={name:e.name||"clip_"+n.animations.length,samplers:a,channels:o};return this.serializeUserData(e,c),n.animations.push(c),n.animations.length-1}processSkin(e){let t=this.json,n=this.nodeMap,i=t.nodes[n.get(e)],r=e.skeleton;if(r===void 0)return null;let o=e.skeleton.bones[0];if(o===void 0)return null;let a=[],c=new Float32Array(r.bones.length*16),l=new Ce;for(let u=0;u<r.bones.length;++u)a.push(n.get(r.bones[u])),l.copy(r.boneInverses[u]),l.multiply(e.bindMatrix).toArray(c,u*16);return t.skins===void 0&&(t.skins=[]),t.skins.push({inverseBindMatrices:this.processAccessor(new Ke(c,16)),joints:a,skeleton:n.get(o)}),i.skin=t.skins.length-1}async processNodeAsync(e){let t=this.json,n=this.options,i=this.nodeMap;t.nodes||(t.nodes=[]);let r={};if(n.trs){let a=e.quaternion.toArray(),c=e.position.toArray(),l=e.scale.toArray();So(a,[0,0,0,1])||(r.rotation=a),So(c,[0,0,0])||(r.translation=c),So(l,[1,1,1])||(r.scale=l)}else e.matrixAutoUpdate&&e.updateMatrix(),rM(e.matrix)===!1&&(r.matrix=e.matrix.elements);if(e.name!==""&&(r.name=String(e.name)),this.serializeUserData(e,r),e.isMesh||e.isLine||e.isPoints){let a=await this.processMeshAsync(e);a!==null&&(r.mesh=a)}else e.isCamera&&(r.camera=this.processCamera(e));e.isSkinnedMesh&&this.skins.push(e);let o=t.nodes.push(r)-1;if(i.set(e,o),e.children.length>0){let a=[];for(let c=0,l=e.children.length;c<l;c++){let h=e.children[c];if(h.visible||n.onlyVisible===!1){let u=await this.processNodeAsync(h);u!==null&&a.push(u)}}a.length>0&&(r.children=a)}return await this._invokeAllAsync(function(a){a.writeNode&&a.writeNode(e,r)}),o}async processSceneAsync(e){let t=this.json,n=this.options;t.scenes||(t.scenes=[],t.scene=0);let i={};e.name!==""&&(i.name=e.name),t.scenes.push(i);let r=[];for(let o=0,a=e.children.length;o<a;o++){let c=e.children[o];if(c.visible||n.onlyVisible===!1){let l=await this.processNodeAsync(c);l!==null&&r.push(l)}}r.length>0&&(i.nodes=r),this.serializeUserData(e,i)}async processObjectsAsync(e){let t=new On;t.name="AuxScene";for(let n=0;n<e.length;n++)t.children.push(e[n]);await this.processSceneAsync(t)}async processInputAsync(e){let t=this.options;e=e instanceof Array?e:[e],await this._invokeAllAsync(function(i){i.beforeParse&&i.beforeParse(e)});let n=[];for(let i=0;i<e.length;i++)e[i]instanceof On?await this.processSceneAsync(e[i]):n.push(e[i]);n.length>0&&await this.processObjectsAsync(n);for(let i=0;i<this.skins.length;++i)this.processSkin(this.skins[i]);for(let i=0;i<t.animations.length;++i)this.processAnimation(t.animations[i],e[0]);await this._invokeAllAsync(function(i){i.afterParse&&i.afterParse(e)})}async _invokeAllAsync(e){for(let t=0,n=this.plugins.length;t<n;t++)await e(this.plugins[t])}},hu=class{constructor(e){this.writer=e,this.name="KHR_lights_punctual"}writeNode(e,t){if(!e.isLight)return;if(!e.isDirectionalLight&&!e.isPointLight&&!e.isSpotLight){console.warn("THREE.GLTFExporter: Only directional, point, and spot lights are supported.",e);return}let n=this.writer,i=n.json,r=n.extensionsUsed,o={};e.name&&(o.name=e.name),o.color=e.color.toArray(),o.intensity=e.intensity,e.isDirectionalLight?o.type="directional":e.isPointLight?(o.type="point",e.distance>0&&(o.range=e.distance)):e.isSpotLight&&(o.type="spot",e.distance>0&&(o.range=e.distance),o.spot={},o.spot.innerConeAngle=(1-e.penumbra)*e.angle,o.spot.outerConeAngle=e.angle),e.decay!==void 0&&e.decay!==2&&console.warn("THREE.GLTFExporter: Light decay may be lost. glTF is physically-based, and expects light.decay=2."),e.target&&(e.target.parent!==e||e.target.position.x!==0||e.target.position.y!==0||e.target.position.z!==-1)&&console.warn("THREE.GLTFExporter: Light direction may be lost. For best results, make light.target a child of the light with position 0,0,-1."),r[this.name]||(i.extensions=i.extensions||{},i.extensions[this.name]={lights:[]},r[this.name]=!0);let a=i.extensions[this.name].lights;a.push(o),t.extensions=t.extensions||{},t.extensions[this.name]={light:a.length-1}}},uu=class{constructor(e){this.writer=e,this.name="KHR_materials_unlit"}async writeMaterialAsync(e,t){if(!e.isMeshBasicMaterial)return;let i=this.writer.extensionsUsed;t.extensions=t.extensions||{},t.extensions[this.name]={},i[this.name]=!0,t.pbrMetallicRoughness.metallicFactor=0,t.pbrMetallicRoughness.roughnessFactor=.9}},du=class{constructor(e){this.writer=e,this.name="KHR_materials_clearcoat"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.clearcoat===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.clearcoatFactor=e.clearcoat,e.clearcoatMap){let o={index:await n.processTextureAsync(e.clearcoatMap),texCoord:e.clearcoatMap.channel};n.applyTextureTransform(o,e.clearcoatMap),r.clearcoatTexture=o}if(r.clearcoatRoughnessFactor=e.clearcoatRoughness,e.clearcoatRoughnessMap){let o={index:await n.processTextureAsync(e.clearcoatRoughnessMap),texCoord:e.clearcoatRoughnessMap.channel};n.applyTextureTransform(o,e.clearcoatRoughnessMap),r.clearcoatRoughnessTexture=o}if(e.clearcoatNormalMap){let o={index:await n.processTextureAsync(e.clearcoatNormalMap),texCoord:e.clearcoatNormalMap.channel};e.clearcoatNormalScale.x!==1&&(o.scale=e.clearcoatNormalScale.x),n.applyTextureTransform(o,e.clearcoatNormalMap),r.clearcoatNormalTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},fu=class{constructor(e){this.writer=e,this.name="KHR_materials_dispersion"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.dispersion===0)return;let i=this.writer.extensionsUsed,r={};r.dispersion=e.dispersion,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},pu=class{constructor(e){this.writer=e,this.name="KHR_materials_iridescence"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.iridescence===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.iridescenceFactor=e.iridescence,e.iridescenceMap){let o={index:await n.processTextureAsync(e.iridescenceMap),texCoord:e.iridescenceMap.channel};n.applyTextureTransform(o,e.iridescenceMap),r.iridescenceTexture=o}if(r.iridescenceIor=e.iridescenceIOR,r.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],r.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1],e.iridescenceThicknessMap){let o={index:await n.processTextureAsync(e.iridescenceThicknessMap),texCoord:e.iridescenceThicknessMap.channel};n.applyTextureTransform(o,e.iridescenceThicknessMap),r.iridescenceThicknessTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},mu=class{constructor(e){this.writer=e,this.name="KHR_materials_transmission"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.transmissionFactor=e.transmission,e.transmissionMap){let o={index:await n.processTextureAsync(e.transmissionMap),texCoord:e.transmissionMap.channel};n.applyTextureTransform(o,e.transmissionMap),r.transmissionTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},gu=class{constructor(e){this.writer=e,this.name="KHR_materials_volume"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;let n=this.writer,i=n.extensionsUsed,r={};if(r.thicknessFactor=e.thickness,e.thicknessMap){let o={index:await n.processTextureAsync(e.thicknessMap),texCoord:e.thicknessMap.channel};n.applyTextureTransform(o,e.thicknessMap),r.thicknessTexture=o}e.attenuationDistance!==1/0&&(r.attenuationDistance=e.attenuationDistance),r.attenuationColor=e.attenuationColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},_u=class{constructor(e){this.writer=e,this.name="KHR_materials_ior"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.ior===1.5)return;let i=this.writer.extensionsUsed,r={};r.ior=e.ior,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},xu=class{constructor(e){this.writer=e,this.name="KHR_materials_specular"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.specularIntensity===1&&e.specularColor.equals(Qv)&&!e.specularIntensityMap&&!e.specularColorMap)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.specularIntensityMap){let o={index:await n.processTextureAsync(e.specularIntensityMap),texCoord:e.specularIntensityMap.channel};n.applyTextureTransform(o,e.specularIntensityMap),r.specularTexture=o}if(e.specularColorMap){let o={index:await n.processTextureAsync(e.specularColorMap),texCoord:e.specularColorMap.channel};n.applyTextureTransform(o,e.specularColorMap),r.specularColorTexture=o}r.specularFactor=e.specularIntensity,r.specularColorFactor=e.specularColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},yu=class{constructor(e){this.writer=e,this.name="KHR_materials_sheen"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.sheen==0)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.sheenRoughnessMap){let o={index:await n.processTextureAsync(e.sheenRoughnessMap),texCoord:e.sheenRoughnessMap.channel};n.applyTextureTransform(o,e.sheenRoughnessMap),r.sheenRoughnessTexture=o}if(e.sheenColorMap){let o={index:await n.processTextureAsync(e.sheenColorMap),texCoord:e.sheenColorMap.channel};n.applyTextureTransform(o,e.sheenColorMap),r.sheenColorTexture=o}r.sheenRoughnessFactor=e.sheenRoughness,r.sheenColorFactor=e.sheenColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},vu=class{constructor(e){this.writer=e,this.name="KHR_materials_anisotropy"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.anisotropy==0)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.anisotropyMap){let o={index:await n.processTextureAsync(e.anisotropyMap)};n.applyTextureTransform(o,e.anisotropyMap),r.anisotropyTexture=o}r.anisotropyStrength=e.anisotropy,r.anisotropyRotation=e.anisotropyRotation,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Mu=class{constructor(e){this.writer=e,this.name="KHR_materials_emissive_strength"}async writeMaterialAsync(e,t){if(!e.isMeshStandardMaterial||e.emissiveIntensity===1)return;let i=this.writer.extensionsUsed,r={};r.emissiveStrength=e.emissiveIntensity,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},bu=class{constructor(e){this.writer=e,this.name="EXT_materials_bump"}async writeMaterialAsync(e,t){if(!e.isMeshStandardMaterial||e.bumpScale===1&&!e.bumpMap)return;let n=this.writer,i=n.extensionsUsed,r={};if(e.bumpMap){let o={index:await n.processTextureAsync(e.bumpMap),texCoord:e.bumpMap.channel};n.applyTextureTransform(o,e.bumpMap),r.bumpTexture=o}r.bumpFactor=e.bumpScale,t.extensions=t.extensions||{},t.extensions[this.name]=r,i[this.name]=!0}},Su=class{constructor(e){this.writer=e,this.name="EXT_mesh_gpu_instancing"}writeNode(e,t){if(!e.isInstancedMesh)return;let n=this.writer,i=e,r=new Float32Array(i.count*3),o=new Float32Array(i.count*4),a=new Float32Array(i.count*3),c=new Ce,l=new R,h=new Vt,u=new R;for(let d=0;d<i.count;d++)i.getMatrixAt(d,c),c.decompose(l,h,u),l.toArray(r,d*3),h.toArray(o,d*4),u.toArray(a,d*3);let f={TRANSLATION:n.processAccessor(new Ke(r,3)),ROTATION:n.processAccessor(new Ke(o,4)),SCALE:n.processAccessor(new Ke(a,3))};i.instanceColor&&(f._COLOR_0=n.processAccessor(i.instanceColor)),t.extensions=t.extensions||{},t.extensions[this.name]={attributes:f},n.extensionsUsed[this.name]=!0,n.extensionsRequired[this.name]=!0}};_s.Utils={insertKeyframe:function(s,e){let n=s.getValueSize(),i=new s.TimeBufferType(s.times.length+1),r=new s.ValueBufferType(s.values.length+n),o=s.createInterpolant(new s.ValueBufferType(n)),a;if(s.times.length===0){i[0]=e;for(let c=0;c<n;c++)r[c]=0;a=0}else if(e<s.times[0]){if(Math.abs(s.times[0]-e)<.001)return 0;i[0]=e,i.set(s.times,1),r.set(o.evaluate(e),0),r.set(s.values,n),a=0}else if(e>s.times[s.times.length-1]){if(Math.abs(s.times[s.times.length-1]-e)<.001)return s.times.length-1;i[i.length-1]=e,i.set(s.times,0),r.set(s.values,0),r.set(o.evaluate(e),s.values.length),a=i.length-1}else for(let c=0;c<s.times.length;c++){if(Math.abs(s.times[c]-e)<.001)return c;if(s.times[c]<e&&s.times[c+1]>e){i.set(s.times.slice(0,c+1),0),i[c+1]=e,i.set(s.times.slice(c+1),c+2),r.set(s.values.slice(0,(c+1)*n),0),r.set(o.evaluate(e),(c+1)*n),r.set(s.values.slice((c+1)*n),(c+2)*n),a=c+1;break}}return s.times=i,s.values=r,a},mergeMorphTargetTracks:function(s,e){let t=[],n={},i=s.tracks;for(let r=0;r<i.length;++r){let o=i[r],a=Ze.parseTrackName(o.name),c=Ze.findNode(e,a.nodeName);if(a.propertyName!=="morphTargetInfluences"||a.propertyIndex===void 0){t.push(o);continue}if(o.createInterpolant!==o.InterpolantFactoryMethodDiscrete&&o.createInterpolant!==o.InterpolantFactoryMethodLinear){if(o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline)throw new Error("THREE.GLTFExporter: Cannot merge tracks with glTF CUBICSPLINE interpolation.");console.warn("THREE.GLTFExporter: Morph target interpolation mode not yet supported. Using LINEAR instead."),o=o.clone(),o.setInterpolation(ai)}let l=c.morphTargetInfluences.length,h=c.morphTargetDictionary[a.propertyIndex];if(h===void 0)throw new Error("THREE.GLTFExporter: Morph target name not found: "+a.propertyIndex);let u;if(n[c.uuid]===void 0){u=o.clone();let d=new u.ValueBufferType(l*u.times.length);for(let m=0;m<u.times.length;m++)d[m*l+h]=u.values[m];u.name=(a.nodeName||"")+".morphTargetInfluences",u.values=d,n[c.uuid]=u,t.push(u);continue}let f=o.createInterpolant(new o.ValueBufferType(1));u=n[c.uuid];for(let d=0;d<u.times.length;d++)u.values[d*l+h]=f.evaluate(u.times[d]);for(let d=0;d<o.times.length;d++){let m=this.insertKeyframe(u,o.times[d]);u.values[m*l+h]=o.values[d]}}return s.tracks=t,s},toFloat32BufferAttribute:function(s){let e=new Ke(new Float32Array(s.count*s.itemSize),s.itemSize,!1);if(!s.normalized&&!s.isInterleavedBufferAttribute)return e.array.set(s.array),e;for(let t=0,n=s.count;t<n;t++)for(let i=0;i<s.itemSize;i++)e.setComponent(t,i,s.getComponent(t,i));return e}};function kc(s){let[e,t,n]=mr(s);return new we().setRGB(e/255,t/255,n/255,ct)}function wo(s,e,t,n,i,r,o){let a=n-t,c=o-r;if(a<=1e-4||c<=1e-4)return null;let l=new li(a,i,c),h=(t+n)/2,u=Math.atan2(e[1],e[0]),f=new Ce().makeTranslation(s[0]+e[0]*h,s[1]+e[1]*h,r+c/2).multiply(new Ce().makeRotationZ(u));return l.applyMatrix4(f),l}function cM(s,e,t=.04){let n=new js(s.map(([a,c])=>({x:a,y:c}))),i=new to(n),r=i.clone().applyMatrix4(new Ce().makeTranslation(0,0,e)),o=i.clone().applyMatrix4(new Ce().makeTranslation(0,0,e-t));return vo([r,o].filter(Boolean))}function Op(s){let e=new yi(s),t=s.level,n=new On;n.name=Bt(s.meta.name,"home");let i={wall:new Qt({name:"dv_wall",color:kc(s.materials.wall),roughness:.85,metalness:0}),floor:new Qt({name:"dv_floor",color:kc(s.materials.floor),roughness:.7,metalness:0,side:At}),furniture:new Qt({name:"dv_furniture",color:kc(s.materials.furniture),roughness:.8,metalness:0}),glass:new qt({name:"dv_glass",color:14674674,roughness:.05,metalness:0,transparent:!0,opacity:.25,transmission:.85,thickness:.006})},r=[];for(let d of s.rooms)d.polygon.length<3||r.push(cM(e.polygon(d.polygon),t.elevation));if(r.length){let d=new pt(vo(r),i.floor);d.name="dv_floor",n.add(d)}let o=[],a=[];for(let d of s.walls){let{tangent:m,length:_}=pr(d),g=e.length(Math.hypot(d.b[0]-d.a[0],d.b[1]-d.a[1])),p=e.point(d.a),b=t.elevation,v=b+d.height,x=s.openings.filter(T=>T.wall===d.id).map(T=>{let C=e.length(T.offset);return{from:Math.max(0,C-T.width/2),to:Math.min(g,C+T.width/2),sill:b+T.sill,head:Math.min(v,b+T.head),type:T.type,id:T.id}}).filter(T=>T.to>T.from).sort((T,C)=>T.from-C.from),S=0;for(let T of x)o.push(wo(p,m,S,T.from,d.thickness,b,v)),o.push(wo(p,m,T.from,T.to,d.thickness,b,T.sill)),o.push(wo(p,m,T.from,T.to,d.thickness,T.head,v)),T.type!=="door"&&a.push(wo(p,m,T.from,T.to,.012,T.sill,T.head)),S=Math.max(S,T.to);o.push(wo(p,m,S,g,d.thickness,b,v))}let c=o.filter(Boolean);if(c.length){let d=new pt(vo(c),i.wall);d.name="dv_walls",n.add(d)}let l=a.filter(Boolean);if(l.length){let d=new pt(vo(l),i.glass);d.name="dv_glass",n.add(d)}let h=s.furniture.filter(d=>d.solid);if(h.length){let d=new Rt;d.name="dv_furniture";for(let m of h){let _=m.rect.map(T=>e.point(T)),g=_.map(T=>T[0]),p=_.map(T=>T[1]),b=Math.max(...g)-Math.min(...g),v=Math.max(...p)-Math.min(...p),x=Math.max(.02,m.top-m.base);if(b<.001||v<.001)continue;let S=new pt(new li(b,v,x),i.furniture);S.name=`dv_occluder_${Bt(m.name,m.id)}`,S.position.set((Math.min(...g)+Math.max(...g))/2,(Math.min(...p)+Math.max(...p))/2,m.base+x/2),d.add(S)}d.children.length&&n.add(d)}let u=new Set,f=new Rt;f.name="dv_lights";for(let[d,m]of s.fixtures.entries()){let _=Bt(m.name,`${m.kind}_${d+1}`),g=2;for(;u.has(_);)_=`${Bt(m.name,`${m.kind}_${d+1}`)}_${g++}`;u.add(_);let p=new Rt;p.name=`dv_light_${_}`;let b=new Qt({name:`dv_emissive_${_}`,color:1710618,emissive:kc(m.color),emissiveIntensity:1,roughness:.4});for(let v of m.emitters){let[x,S]=e.point(v.point),T=v.type==="strip"?.02:.045,C=new pt(new no(T,10,8),b);C.position.set(x,S,v.height),p.add(C)}p.children.length&&f.add(p)}return f.children.length&&n.add(f),{scene:n,transform:e}}async function To(s){let{scene:e}=Op(s),t=new Rt;for(t.name="dv_root",t.rotation.x=-Math.PI/2;e.children.length;)t.add(e.children[0]);let n=new On;n.name=e.name,n.add(t),n.updateMatrixWorld(!0);let i=new _s;return new Promise((r,o)=>{i.parse(n,a=>{a instanceof ArrayBuffer?r(a):o(new Error("GLTFExporter returned JSON where binary was requested"))},a=>o(a instanceof Error?a:new Error(String(a))),{binary:!0,onlyVisible:!1,truncateDrawRange:!1})})}function Fp(s){let{scene:e}=Op(s),t=0,n=0;e.traverse(r=>{if(!r.isMesh)return;n+=1;let o=r.geometry.getIndex(),a=r.geometry.getAttribute("position");t+=(o?o.count:a?.count||0)/3,r.geometry.dispose()});let i=new R;return{triangles:Math.round(t),meshes:n,size:i}}var zc=class{constructor({project:e,container:t,controls:n}){this.project=e,this.container=t,this.controls=n,this.renderer=null,this.modelUrl=null,this.busy=!1,this.stale=!0,this.preview={enabled:!0,hour:14,cloud:20,brightness:100,coverPosition:100,weather:"dry",moonPhase:"auto",on:{},levels:{},latitude:51,longitude:7}}markStale(){this.stale=!0,this.refreshButton&&this.refreshButton.classList.add("attention")}async refresh(){if(this.busy)return;let e=this.project.data;if(!e.plan.scale){Ot("Calibrate the plan scale before previewing.","warn");return}if(!e.walls.length&&!e.rooms.length){Ot("Trace some walls or a room first.","warn");return}this.busy=!0,this.setStatus("Building model\u2026");try{this.dispose();let t=await To(e);this.modelUrl=URL.createObjectURL(new Blob([t],{type:"model/gltf-binary"}));let n=gs(e,{modelFile:this.modelUrl}),i=qu(n,".");this.state=new Fo(i,{entities:{}},this.preview);for(let r of i.fixtures)r.kind==="light"&&(this.preview.on[r.id]??=!0);this.state.setPreview(this.preview),this.renderer=new Bc({pack:i,quality:"high",interactive:!0,showWeather:!0,onError:r=>Ot(r.message,"error")}),await this.renderer.init(this.container),this.apply(),this.stale=!1,this.refreshButton?.classList.remove("attention"),this.setStatus(`${i.fixtures.length} fixtures \xB7 ${i.rooms.length} rooms \xB7 ${i.openings.length} openings`)}catch(t){console.error(t),this.setStatus(`Preview failed: ${t.message}`),Ot(`Preview failed: ${t.message}`,"error")}finally{this.busy=!1}}apply(){!this.renderer?.ready||!this.state||(this.state.setPreview(this.preview),this.renderer.apply(this.state.snapshot()))}setStatus(e){this.statusNode&&(this.statusNode.textContent=e)}renderControls(){if(!this.controls)return;this.controls.replaceChildren(),this.refreshButton=nt("Rebuild preview",()=>this.refresh(),{class:"primary"}),this.statusNode=$("span",{class:"note"},"Not built yet.");let e=(t,n)=>{this.preview={...this.preview,[t]:n},this.apply()};this.controls.append($("div",{class:"preview-actions"},[this.refreshButton,nt("All on",()=>{let t={};for(let n of this.state?.pack.fixtures||[])n.kind==="light"&&(t[n.id]=!0);e("on",t)},{class:"ghost"}),nt("All off",()=>e("on",{}),{class:"ghost"}),nt("Reset view",()=>this.renderer?.resetView(),{class:"ghost"})]),Re("Time of day",En(this.preview.hour,t=>e("hour",t),{min:0,max:23.75,step:.25,format:lM})),Re("Clouds",En(this.preview.cloud,t=>e("cloud",t),{min:0,max:100,step:5,format:t=>`${t} %`})),Re("Blinds",En(this.preview.coverPosition,t=>e("coverPosition",t),{min:0,max:100,step:5,format:t=>`${t} %`})),Re("Lamp brightness",En(this.preview.brightness,t=>e("brightness",t),{min:5,max:100,step:5,format:t=>`${t} %`})),Re("Weather",hM(this.preview.weather,t=>e("weather",t))),this.statusNode)}dispose(){this.renderer?.dispose(),this.renderer=null,this.modelUrl&&(URL.revokeObjectURL(this.modelUrl),this.modelUrl=null)}resize(){this.renderer?.resize()}};function lM(s){let e=Math.floor(s),t=Math.round((s-e)*60);return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}`}function hM(s,e){let t=$("select",{},[["dry","Dry"],["rain","Rain"],["snow","Snow"],["mixed","Sleet"]].map(([n,i])=>$("option",{value:n,textContent:i,selected:n===s})));return t.onchange=()=>e(t.value),t}var uM=(()=>{let s=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let n=0;n<8;n++)t=t&1?3988292384^t>>>1:t>>>1;s[e]=t>>>0}return s})();function dM(s){let e=4294967295;for(let t=0;t<s.length;t++)e=uM[(e^s[t])&255]^e>>>8;return(e^4294967295)>>>0}function fM(s=new Date){let e=Math.max(1980,s.getFullYear());return{time:s.getHours()<<11|s.getMinutes()<<5|s.getSeconds()>>1,date:e-1980<<9|s.getMonth()+1<<5|s.getDate()}}function pM(s){return s instanceof Uint8Array?s:s instanceof ArrayBuffer?new Uint8Array(s):ArrayBuffer.isView(s)?new Uint8Array(s.buffer,s.byteOffset,s.byteLength):new TextEncoder().encode(String(s))}var wu=class{constructor(){this.chunks=[],this.length=0}push(e){this.chunks.push(e),this.length+=e.length}struct(e){let t=e.reduce((o,[a])=>o+a,0),n=new ArrayBuffer(t),i=new DataView(n),r=0;for(let[o,a]of e)o===2?i.setUint16(r,a,!0):i.setUint32(r,a,!0),r+=o;this.push(new Uint8Array(n))}toBlob(e="application/zip"){return new Blob(this.chunks,{type:e})}};function Bp(s){if(s.length>65535)throw new Error("Too many files for a non-ZIP64 archive");let e=new wu,t=[],n=new TextEncoder;for(let o of s){let a=n.encode(o.name.replace(/\\/g,"/")),c=pM(o.content);if(c.length>4294967295)throw new Error(`${o.name} is too large for a non-ZIP64 archive`);let l=dM(c),h=fM(o.date),u=e.length;e.struct([[4,67324752],[2,20],[2,2048],[2,0],[2,h.time],[2,h.date],[4,l],[4,c.length],[4,c.length],[2,a.length],[2,0]]),e.push(a),e.push(c),t.push({name:a,crc:l,size:c.length,stamp:h,offset:u})}let i=e.length;for(let o of t)e.struct([[4,33639248],[2,20],[2,20],[2,2048],[2,0],[2,o.stamp.time],[2,o.stamp.date],[4,o.crc],[4,o.size],[4,o.size],[2,o.name.length],[2,0],[2,0],[2,0],[2,0],[4,0],[4,o.offset]]),e.push(o.name);let r=e.length-i;return e.struct([[4,101010256],[2,0],[2,0],[2,t.length],[2,t.length],[4,r],[4,i],[2,0]]),e.toBlob()}function ur(s,e){let t=URL.createObjectURL(s),n=document.createElement("a");n.href=t,n.download=e,n.rel="noopener",document.body.append(n),n.click(),n.remove(),setTimeout(()=>URL.revokeObjectURL(t),3e4)}function kp(s){let e=String(s);return e===""?"''":/^[A-Za-z0-9_/][A-Za-z0-9_.\-/]*$/.test(e)?e:`'${e.replace(/'/g,"''")}'`}function Hi(s){return String(s).replace(/\s*[\r\n]+\s*/g," ").trim()}function Tu(s){let e=s.reduce((t,n)=>Math.max(t,`    ${n.key}: ${n.value}`.length),0);return Math.min(e,56)}function mM(s){let e=[];s.kind&&s.kind!=="light"&&e.push(s.kind);let t=s.emitters?.length??0;t>1&&e.push(`${t} bulbs`);let n=s.emitters?.[0]?.type;n&&n!=="point"&&e.push(n);let i=s.name||s.id;return e.length?`${i} \xB7 ${e.join(", ")}`:i}function Eu(s,{version:e="0.1.0",packPath:t=null}={}){let n=s.pack||{},i=n.id||"home",r=t||`/local/domoview/homes/${i}`,o=s.rooms||[],a=new Map(o.map(d=>[d.id,d.name||d.id])),c=[];c.push(`# DomoView card for "${Hi(n.name||i)}"`,`# Generated by DomoView Studio ${e}`,"#","# 1. Copy the pack folder next to this file into your Home Assistant config:",`#      /config/www/domoview/homes/${i}/`,"#    so that /config/www/domoview/homes/"+i+"/home.json exists.","#","# 2. Paste everything below into a dashboard card:","#      Edit dashboard \u2192 + Add card \u2192 Manual","#","# 3. Replace each '' with one of your entities. You can also do this in the","#    card's visual editor, which lists the same keys with entity pickers.","#","# Keep this file OUT of /config/www. Anything under www is served without","# authentication, and once you fill it in this lists your entity ids.","","type: custom:domoview-card",`home: ${kp(r)}`);let l=s.cameras||[];if(l.length>1){let d=l.find(m=>m.default)||l[0];c.push(`camera: ${kp(d.id)}   # ${Hi(l.map(m=>m.id).join(", "))}`)}(s.variants||[]).length&&c.push(`# variant: ${s.variants[0].id}   # ${Hi(s.variants.map(d=>d.name).join(", "))}`),c.push("# renderer: auto      # auto | live3d | baked"),c.push("# quality: medium     # low | medium | high");let h=(s.fixtures||[]).filter(d=>d.kind!=="marker");if(!h.length)c.push("","entities: {}   # this pack defines no bindable fixtures");else{c.push("","entities:");let d=new Map;for(let _ of h){let g=_.room||"";d.has(g)||d.set(g,[]),d.get(g).push(_)}let m=!0;for(let[_,g]of d){m||c.push(""),m=!1,c.push(`  # ${Hi(a.get(_)||"Unassigned")}`);let p=g.map(v=>({key:v.id,value:"''",note:mM(v)})),b=Tu(p)-2;for(let v of p){let x=`  ${v.key}: ${v.value}`;c.push(v.note?`${x.padEnd(b)}  # ${Hi(v.note)}`:x)}}}let u=(s.openings||[]).filter(d=>d.cover);if(c.push("","# Blinds and shutters. Needs a cover.* entity that reports current_position."),!u.length)c.push("covers: {}   # no window in this pack is marked as having a blind");else{c.push("covers:");let d=u.map(_=>({key:_.id,value:"''",note:_.name||_.id})),m=Tu(d)-2;for(let _ of d)c.push(`  ${_.key}: ${_.value}`.padEnd(m)+`  # ${Hi(_.note)}`)}let f=(s.openings||[]).filter(d=>d.type!=="door");if(c.push("","# Optional. A window reported open gets a small badge above it."),!f.length)c.push("window_sensors: {}");else{c.push("window_sensors:");let d=f.map(_=>({key:_.id,value:"''",note:_.name||_.id})),m=Tu(d)-2;for(let _ of d)c.push(`  ${_.key}: ${_.value}`.padEnd(m)+`  # ${Hi(_.note)}`)}if(c.push("","# Optional. Only rooms with a reading get a temperature/humidity chip."),!o.length)c.push("rooms: {}");else{c.push("rooms:");for(let d of o)c.push(`  ${d.id}:   # ${Hi(d.name||d.id)}`),c.push("    temperature: ''"),c.push("    humidity: ''")}return c.push("","# Sun and weather. All optional: without them DomoView uses sun.sun, the","# first available weather.* entity, and your Home Assistant location.","# An irradiance sensor is the single biggest improvement to how light reads,","# because a thin overcast and a bright haze report the same condition.","sun_entity: sun.sun","# weather_entity: weather.home","# cloud_entity: sensor.cloud_coverage","# irradiance_entity: sensor.solar_radiation","# illuminance_entity: sensor.outdoor_illuminance","# rain_entity: binary_sensor.rain","# snow_entity: binary_sensor.snow","# precipitation_rate_entity: sensor.rain_rate","# wind_speed_entity: sensor.wind_speed","# snow_depth_entity: sensor.snow_depth","# moon_entity: sensor.moon_phase",""),c.join(`
`)}function zp(s){return{fixtures:(s.fixtures||[]).filter(e=>e.kind!=="marker").length,covers:(s.openings||[]).filter(e=>e.cover).length,windows:(s.openings||[]).filter(e=>e.type!=="door").length,rooms:(s.rooms||[]).length}}var Vi="0.1.0",Au="domoview.studio.project",Hc=[{id:"plan",label:"Plan",tool:"select"},{id:"scale",label:"Scale",tool:"calibrate"},{id:"walls",label:"Walls",tool:"wall"},{id:"rooms",label:"Rooms",tool:"room"},{id:"openings",label:"Windows",tool:"window"},{id:"lights",label:"Lights",tool:"light"},{id:"furniture",label:"Furniture",tool:"furniture"},{id:"photos",label:"Photos",tool:"select"},{id:"preview",label:"Preview",tool:"select"},{id:"export",label:"Export",tool:"select"}],Ru=class{constructor(e){this.root=e,this.project=gM(),this.step="plan",this.build(),this.project.subscribe(()=>this.onProjectChange()),this.setStep("plan"),this.loadBackdrop()}build(){this.root.replaceChildren(),this.canvas=$("canvas",{class:"plan-canvas",tabIndex:0}),this.previewHost=$("div",{class:"preview-host",hidden:!0}),this.stage=$("div",{class:"stage"},[this.canvas,this.previewHost]),this.outlineHost=$("div",{class:"outline"}),this.inspectorHost=$("div",{class:"inspector"}),this.stepPanelHost=$("div",{class:"step-panel"}),this.hintNode=$("p",{class:"hint"}),this.summaryNode=$("p",{class:"summary"}),this.stepsNav=$("nav",{class:"steps","aria-label":"Authoring steps"},Hc.map(e=>nt(e.label,()=>this.setStep(e.id),{class:"step",dataset:{step:e.id}}))),this.root.append($("header",{class:"topbar"},[$("div",{class:"brand"},[$("strong",{},"DomoView Studio"),$("span",{class:"version"},Vi)]),$("div",{class:"topbar-actions"},[nt("New",()=>this.newProject(),{class:"ghost"}),nt("Open\u2026",()=>this.openProject(),{class:"ghost"}),nt("Save project",()=>this.saveProject(),{class:"ghost"}),nt("Undo",()=>this.project.undo(),{class:"ghost",title:"Ctrl+Z"}),nt("Redo",()=>this.project.redo(),{class:"ghost",title:"Ctrl+Shift+Z"}),nt("Export pack",()=>{this.setStep("export")},{class:"primary"})])]),this.stepsNav,$("main",{class:"workspace"},[$("aside",{class:"column left"},[$("h2",{},"Outline"),this.outlineHost]),this.stage,$("aside",{class:"column right"},[this.stepPanelHost,this.inspectorHost])]),$("footer",{class:"statusbar"},[this.hintNode,this.summaryNode])),this.viewport=new Ro(this.canvas),this.viewport.attach(),this.renderer=new Io(this.canvas,this.viewport),this.viewport.onChange=()=>this.draw(),this.editor=new Lo({canvas:this.canvas,viewport:this.viewport,project:this.project,onRedraw:()=>this.draw(),onSelect:()=>this.renderSide(),onAskDistance:e=>Hu({title:"Calibrate scale",message:`How long is that line in reality? It measures ${Math.round(e)} plan pixels.`,unit:"m",initial:""}),onStatus:e=>{e?.error?Ot(e.error,"warn"):typeof e=="string"&&(this.hintNode.textContent=e)}}),this.photos=new Uo({project:this.project,container:$("div"),onPickColor:(e,t)=>this.showColourMenu(e,t)}),this.preview=new zc({project:this.project,container:this.previewHost,controls:$("div",{class:"preview-controls"})}),this.observer=new ResizeObserver(()=>{this.renderer.resize(),this.draw(),this.preview.resize()}),this.observer.observe(this.stage),this.installDropTarget(),this.installShortcuts()}setStep(e){let t=Hc.find(i=>i.id===e)||Hc[0];this.step=t.id;for(let i of this.stepsNav.children)i.classList.toggle("active",i.dataset.step===t.id);let n=t.id==="preview";this.previewHost.hidden=!n,this.canvas.hidden=n,this.editor.setTool(t.tool),n&&(this.preview.renderControls(),this.preview.stale&&this.preview.refresh()),this.renderSide(),this.hintNode.textContent=this.editor.hint(),n||(this.renderer.resize(),this.draw())}renderSide(){this.stepPanelHost.replaceChildren(this.stepPanel()),Gu(this.inspectorHost,{project:this.project,editor:this.editor,selected:this.editor.selected,onPlanImage:e=>this.setPlanImage(e)}),Wu(this.outlineHost,{project:this.project,editor:this.editor}),this.summaryNode.textContent=Xu(this.project.data)}stepPanel(){switch(this.step){case"photos":return this.photos.container=$("div",{class:"photo-shelf"}),this.photos.render(),Wt("Photos",[this.photos.container]);case"preview":return Wt("Preview",[this.preview.controls]);case"export":return this.exportPanel();case"openings":return Wt("Windows and doors",[$("p",{class:"note"},"Click on a wall to place a window. Switch the tool to Door in the panel below, or press D."),$("div",{class:"preview-actions"},[nt("Window tool",()=>this.editor.setTool("window"),{class:this.editor.tool==="window"?"primary":"ghost"}),nt("Door tool",()=>this.editor.setTool("door"),{class:this.editor.tool==="door"?"primary":"ghost"})])]);case"scale":return Wt("Scale",[$("p",{class:"note"},"Click the two ends of something you know the length of \u2014 a door is usually 0.90 m, a room wall is better if you have a measurement."),this.project.data.plan.scale?nt("Re-calibrate",()=>this.editor.setTool("calibrate"),{class:"ghost"}):null]);default:return Wt(Hc.find(e=>e.id===this.step)?.label||"",[$("p",{class:"note"},this.editor.hint())])}}async setPlanImage(e){try{let t=await Do(e),{dataUrl:n,width:i,height:r}=await No(t);this.project.commit("load plan",o=>{o.plan.image=n,o.plan.imageWidth=i,o.plan.imageHeight=r}),await this.loadBackdrop(),this.viewport.fit(i,r),this.project.data.plan.scale||(Ot("Plan loaded. Calibrate the scale next.","info"),this.setStep("scale"))}catch(t){Ot(t.message,"error")}}async loadBackdrop(){let e=this.project.data;try{await this.renderer.setBackdrop(e.plan.image)}catch(t){Ot(t.message,"error")}this.renderer.resize(),e.plan.imageWidth&&this.viewport.fit(e.plan.imageWidth,e.plan.imageHeight),this.draw()}installDropTarget(){let e=t=>{t.preventDefault(),t.stopPropagation()};for(let t of["dragenter","dragover","dragleave","drop"])this.stage.addEventListener(t,e);this.stage.addEventListener("dragover",()=>this.stage.classList.add("dropping")),this.stage.addEventListener("dragleave",()=>this.stage.classList.remove("dropping")),this.stage.addEventListener("drop",t=>{this.stage.classList.remove("dropping");let n=[...t.dataTransfer?.files||[]];if(!n.length)return;let i=n.find(r=>r.name.endsWith(".json"));if(i){this.readProjectFile(i);return}this.step==="photos"?this.photos.add(n):this.setPlanImage(n[0])})}installShortcuts(){window.addEventListener("keydown",e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.ctrlKey||e.metaKey||e.altKey)return;let n={v:"select",c:"calibrate",w:"wall",r:"room",n:"window",d:"door",l:"light",f:"furniture"}[e.key.toLowerCase()];n&&(this.editor.setTool(n),this.hintNode.textContent=this.editor.hint())})}showColourMenu(e,t){this.root.querySelector(".colour-menu")?.remove();let i=Yu(e,{project:this.project,selected:this.editor.selected,onDone:()=>i.remove()});this.stepPanelHost.prepend(i)}onProjectChange(){this.editor.project=this.project,this.preview.project=this.project,this.photos.project=this.project,this.draw(),this.renderSide(),this.preview.markStale(),this.persist()}persist(){try{localStorage.setItem(Au,this.project.toJSON())}catch{this.summaryNode.textContent="Autosave is full \u2014 use Save project to keep your work."}}newProject(){confirm("Discard the current project and start over?")&&(localStorage.removeItem(Au),location.reload())}saveProject(){let e=Bt(this.project.data.meta.id||this.project.data.meta.name,"home");ur(new Blob([this.project.toJSON()],{type:"application/json"}),`${e}.domoview.json`)}openProject(){let e=$("input",{type:"file",accept:".json,application/json"});e.onchange=()=>{e.files?.[0]&&this.readProjectFile(e.files[0])},e.click()}async readProjectFile(e){try{let t=await e.text(),n=vs.fromJSON(t);this.project=n,this.editor.project=n,this.preview.project=n,this.photos.project=n,n.subscribe(()=>this.onProjectChange()),await this.loadBackdrop(),this.preview.markStale(),this.renderSide(),Ot(`Opened ${e.name}`,"info")}catch(t){Ot(`Could not open that project: ${t.message}`,"error")}}exportPanel(){let e=this.project.data,t=Ou(e),n=t.filter(r=>["scale","walls","rooms"].includes(r.step)),i=null;try{i=e.plan.scale?Fp(e):null}catch{i=null}return Wt("Export Home Pack",[t.length?$("ul",{class:"issues"},t.map(r=>$("li",{class:n.includes(r)?"blocking":""},r.text))):$("p",{class:"note ok"},"Everything needed is in place."),i?$("p",{class:"note"},`Model: ${i.meshes} meshes, about ${i.triangles.toLocaleString()} triangles.`):null,(()=>{try{let r=zp(gs(e,{version:Vi})),o=(a,c,l)=>`${a} ${a===1?c:l}`;return $("p",{class:"note"},"Card YAML lists "+[o(r.fixtures,"fixture","fixtures"),o(r.covers,"blind","blinds"),o(r.windows,"window contact","window contacts"),o(r.rooms,"room","rooms")].join(", ")+" to map.")}catch{return null}})(),Re("Include marked photos",(()=>{let r=$("input",{type:"checkbox",checked:!!this.includePhotos});return r.onchange=()=>{this.includePhotos=r.checked},r})(),"Only photos ticked on the Photos step"),$("div",{class:"preview-actions"},[nt("Download pack (.zip)",()=>this.exportPack(),{class:"primary",disabled:n.length>0}),nt("Download model only (.glb)",()=>this.exportModelOnly(),{class:"ghost"}),nt("Download home.json",()=>this.exportManifestOnly(),{class:"ghost"}),nt("Download card.yaml",()=>this.exportCardYaml(),{class:"ghost"})]),$("pre",{class:"install-hint"},(()=>{let r=Bt(e.meta.id||e.meta.name,"home");return["The zip contains:","",`  ${r}/                 the pack \u2014 upload this folder`,`  ${r}-card.yaml        paste into a dashboard card`,`  ${r}.domoview.json    your editable source \u2014 keep it`,"","1. Upload the folder to Home Assistant so that",`     /config/www/domoview/homes/${r}/home.json`,"   exists. File Editor, Samba or the VS Code add-on all work.","","2. Open the card YAML, replace each '' with one of your","   entities, and paste it into Edit dashboard \u2192 Add card","   \u2192 Manual.","","Keep the YAML and the project file out of /config/www:","anything under www is served without authentication."].join(`
`)})())])}async exportPack(){let e=this.project.data,t=Bt(e.meta.id||e.meta.name,"home"),n=Ot("Building pack\u2026","info",6e4);try{let i=await To(e),r=gs(e,{version:Vi}),o=[{name:`${t}/home.json`,content:`${JSON.stringify(r,null,2)}
`},{name:`${t}/model.glb`,content:i},{name:`${t}/README.txt`,content:xM(t,e)},{name:`${t}-card.yaml`,content:Eu(r,{version:Vi})},{name:`${t}.domoview.json`,content:this.project.toJSON()}];if(this.includePhotos)for(let a of e.photos.filter(c=>c.include)){let c=_M(a.dataUrl);c&&o.push({name:`${t}/photos/${Bt(a.name,a.id)}.${c.extension}`,content:c.data})}ur(Bp(o),`${t}-domoview-pack.zip`),n.remove(),Ot("Pack downloaded.","ok")}catch(i){n.remove(),console.error(i),Ot(`Export failed: ${i.message}`,"error")}}async exportModelOnly(){try{let e=await To(this.project.data),t=Bt(this.project.data.meta.id,"home");ur(new Blob([e],{type:"model/gltf-binary"}),`${t}.glb`)}catch(e){Ot(`Export failed: ${e.message}`,"error")}}exportCardYaml(){let e=gs(this.project.data,{version:Vi}),t=Bt(this.project.data.meta.id||this.project.data.meta.name,"home");ur(new Blob([Eu(e,{version:Vi})],{type:"text/yaml"}),`${t}-card.yaml`)}exportManifestOnly(){let e=gs(this.project.data,{version:Vi});ur(new Blob([`${JSON.stringify(e,null,2)}
`],{type:"application/json"}),"home.json")}draw(){this.canvas.hidden||this.renderer.draw(this.project.data,this.editor.state)}};function gM(){try{let s=localStorage.getItem(Au);if(s)return vs.fromJSON(s)}catch(s){console.warn("DomoView Studio: autosave could not be restored",s)}return new vs}function _M(s){let e=/^data:([^;,]+)(;base64)?,(.*)$/s.exec(s||"");if(!e)return null;let[,t,n,i]=e,r=t.split("/")[1]?.replace("jpeg","jpg")||"bin";if(!n)return{data:decodeURIComponent(i),extension:r};let o=atob(i),a=new Uint8Array(o.length);for(let c=0;c<o.length;c++)a[c]=o.charCodeAt(c);return{data:a,extension:r}}function xM(s,e){return[`${e.meta.name} \u2014 a DomoView Home Pack`,"",`Created with DomoView Studio ${Vi}.`,e.meta.author?`Author: ${e.meta.author}`:null,e.meta.license?`License: ${e.meta.license}`:null,"","Install","-------",`1. Copy this folder to /config/www/domoview/homes/${s}/`,`   so that /config/www/domoview/homes/${s}/home.json exists.`,"",`2. Open ${s}-card.yaml, which came alongside this folder in the zip.`,"   It lists every fixture, blind, window contact and room this pack","   defines. Replace each '' with one of your entities.","","3. Paste it into Edit dashboard -> + Add card -> Manual.","   The card's visual editor offers the same keys with entity pickers,","   if you would rather click than type.","","Contents","--------","home.json   the manifest: rooms, walls, windows, fixtures, cameras","model.glb   the geometry, Y-up glTF-Binary","","The card YAML and the project file are NOT in this folder on purpose.","Everything under /config/www is served without authentication, and","those two contain your entity ids and your floor plan image.","","Documentation: https://github.com/tomjschr/interactive_floormap"].filter(t=>t!==null).join(`
`)}var Hp=document.querySelector("#studio");Hp&&new Ru(Hp);
//# sourceMappingURL=studio.js.map
