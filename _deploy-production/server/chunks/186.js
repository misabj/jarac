exports.id=186,exports.ids=[186],exports.modules={28303:e=>{function s(e){var s=Error("Cannot find module '"+e+"'");throw s.code="MODULE_NOT_FOUND",s}s.keys=()=>[],s.resolve=s,s.id=28303,e.exports=s},68992:(e,s,a)=>{"use strict";a.d(s,{Sb:()=>l,Wn:()=>t,fw:()=>o,yi:()=>i});let t=["skill_running","skill_shooting","skill_defense","skill_efficiency","skill_goalkeeper","skill_dribbling","skill_substitution","skill_passing","skill_control","skill_stamina","skill_explosiveness"],n=t.slice(0,9),i={skill_running:"Trčanje",skill_shooting:"Šut",skill_defense:"Odbrana",skill_efficiency:"Efikasnost",skill_goalkeeper:"Golman",skill_dribbling:"Dribling",skill_substitution:"Izmena",skill_passing:"Pas",skill_control:"Kontrola",skill_stamina:"Kondicija",skill_explosiveness:"Eksplozivnost"};function l(e){return n.reduce((s,a)=>s+Number(e[a]??0),0)}function o(e){return t.some(s=>null!==e[s]&&void 0!==e[s])}},13344:(e,s,a)=>{"use strict";a.d(s,{nv:()=>v,zd:()=>Q,a1:()=>G,Cf:()=>k,o$:()=>y,S7:()=>ee,XR:()=>q,x3:()=>b,BL:()=>O,oL:()=>m,pk:()=>V,EZ:()=>X,__:()=>Z,Gu:()=>x,fb:()=>K,Z3:()=>j,U6:()=>J,Fe:()=>C,Ee:()=>I,SA:()=>w,bc:()=>g,WP:()=>L,sh:()=>D,rR:()=>h,q4:()=>Y,iT:()=>N,cT:()=>S,vv:()=>B,bz:()=>F,Dq:()=>d,DA:()=>z,$8:()=>$,LU:()=>p,qJ:()=>T,Ys:()=>P,tZ:()=>U,h:()=>M,pR:()=>W,Xy:()=>H,LX:()=>R,mi:()=>u});var t=a(60820);let n={host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"jarac",waitForConnections:!0,connectionLimit:10,queueLimit:0,charset:"utf8mb4_unicode_ci",dateStrings:!0,decimalNumbers:!0},i=globalThis.__jaracPool??t.createPool(n);async function l(e,s=[]){let[a]=await i.query(e,s);return a}async function o(e,s=[]){return(await l(e,s))[0]??null}async function _(e,s=[]){let[a]=await i.execute(e,s);return a}var r=a(68992),E=a(86763),c=a.n(E);async function m(){return await o("SELECT * FROM seasons WHERE is_active = 1 ORDER BY id DESC LIMIT 1")||await o("SELECT * FROM seasons ORDER BY id DESC LIMIT 1")}async function p(){return l("SELECT * FROM seasons ORDER BY starts_at DESC, id DESC")}async function u(e,s){await _("UPDATE seasons SET public_stats_enabled = ? WHERE id = ?",[s?1:0,e])}async function d(e){let s=[],a=[];return e?.onlyActive&&s.push("is_active = 1"),e?.search&&(s.push("(display_name LIKE ? OR nickname LIKE ?)"),a.push(`%${e.search}%`,`%${e.search}%`)),l(`SELECT * FROM players ${s.length?"WHERE "+s.join(" AND "):""} ORDER BY display_name ASC`,a)}async function S(e){return o("SELECT * FROM players WHERE slug = ?",[e])}async function N(e){return o("SELECT * FROM players WHERE id = ?",[e])}async function y(e){let s=e.display_name?.trim()||`${e.last_name} ${e.first_name}`.trim(),a=e.slug&&e.slug.trim()||c()(s,{lower:!0,strict:!0,locale:"sr"})||`player-${Date.now()}`,t=A(e),n=e.skill_total??(0,r.Sb)(t),i=1,l=a;for(;await o("SELECT id FROM players WHERE slug = ?",[a]);)i+=1,a=`${l}-${i}`;return(await _(`INSERT INTO players (
       first_name, last_name, display_name, nickname, slug, photo_url, position,
       skill_running, skill_shooting, skill_defense, skill_efficiency, skill_goalkeeper,
       skill_dribbling, skill_substitution, skill_passing, skill_control,
       skill_explosiveness, skill_stamina, skill_total,
       is_active
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.first_name,e.last_name,s,e.nickname??null,a,e.photo_url??null,e.position??null,...r.Wn.map(e=>t[e]??null),n,!1===e.is_active?0:1])).insertId}async function R(e,s){let a=[],t=[];for(let[e,n]of Object.entries(r.Wn.some(e=>e in s)&&void 0===s.skill_total?{...s,skill_total:(0,r.Sb)(A(s))}:s))void 0!==n&&("is_active"===e?(a.push("is_active = ?"),t.push(n?1:0)):(a.push(`${e} = ?`),t.push(n)));a.length&&(t.push(e),await _(`UPDATE players SET ${a.join(", ")} WHERE id = ?`,t))}function A(e){return Object.fromEntries(r.Wn.map(s=>[s,e[s]??null]))}async function O(e){await _("DELETE FROM players WHERE id = ?",[e])}async function D(e){return e?l("SELECT * FROM matches WHERE season_id = ? ORDER BY played_at DESC, id DESC",[e]):l("SELECT * FROM matches ORDER BY played_at DESC, id DESC")}async function h(){return l(`SELECT m.*, s.name AS season_name
     FROM matches m
     JOIN seasons s ON s.id = m.season_id
     ORDER BY m.played_at DESC, m.id DESC`)}async function C(e){return e?o(`SELECT *
       FROM matches
       WHERE season_id = ?
         AND is_counted = 1
         AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()
       ORDER BY played_at DESC, id DESC
       LIMIT 1`,[e]):o(`SELECT *
     FROM matches
     WHERE is_counted = 1
       AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()
     ORDER BY played_at DESC, id DESC
     LIMIT 1`)}async function T(e,s=3){return e?l(`SELECT *
       FROM matches
       WHERE season_id = ?
         AND DATE_ADD(played_at, INTERVAL 1 HOUR) > NOW()
       ORDER BY played_at ASC, id ASC
       LIMIT ?`,[e,s]):l(`SELECT *
     FROM matches
     WHERE DATE_ADD(played_at, INTERVAL 1 HOUR) > NOW()
     ORDER BY played_at ASC, id ASC
     LIMIT ?`,[s])}async function w(e){return o("SELECT * FROM matches WHERE id = ?",[e])}async function L(e){return l(`SELECT mp.*, p.display_name, p.nickname, p.slug, p.photo_url
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     WHERE mp.match_id = ?
     ORDER BY mp.team ASC, mp.goals DESC, mp.assists DESC, p.display_name ASC`,[e])}async function g(e){return l(`SELECT mp.*, p.display_name, p.nickname, p.slug, p.photo_url
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     WHERE mp.match_id = ?
     ORDER BY
       mp.team ASC,
       CASE mp.lineup_position
         WHEN 'goalkeeper' THEN 1
         WHEN 'defense_top' THEN 2
         WHEN 'defense_bottom' THEN 3
         WHEN 'attack_top' THEN 4
         WHEN 'attack_bottom' THEN 5
         WHEN 'reserve' THEN 6
         ELSE 7
       END ASC,
       mp.id ASC`,[e])}function f(e,s){return e>s?"white_win":s>e?"colored_win":"draw"}async function k(e){let s=e.white_score??0,a=e.colored_score??0;return(await _(`INSERT INTO matches
      (season_id, match_number, played_at, venue, scheduled_time, selector_name,
       white_score, colored_score, result_type, is_counted, notes, report, reporter_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.season_id,e.match_number,e.played_at,e.venue??"KSC Jarac",e.scheduled_time??null,e.selector_name??null,s,a,f(s,a),!1===e.is_counted?0:1,e.notes??null,e.report??null,e.reporter_name??null])).insertId}async function M(e,s){let a=await w(e);if(!a)return;let t={...a,...s},n=t.white_score??0,i=t.colored_score??0;await _(`UPDATE matches SET
       season_id = ?, match_number = ?, played_at = ?, venue = ?, scheduled_time = ?,
       selector_name = ?, white_score = ?, colored_score = ?, result_type = ?,
       is_counted = ?, notes = ?, report = ?, reporter_name = ?
     WHERE id = ?`,[t.season_id,t.match_number,t.played_at,t.venue??"KSC Jarac",t.scheduled_time??null,t.selector_name??null,n,i,f(Number(n),Number(i)),!1===s.is_counted?0:t.is_counted?1:0,t.notes??null,t.report??null,t.reporter_name??null,e])}async function H(e){let s=await o(`SELECT
       COALESCE(SUM(CASE WHEN team = 'white' THEN goals ELSE 0 END), 0) AS white_goals,
       COALESCE(SUM(CASE WHEN team = 'colored' THEN goals ELSE 0 END), 0) AS colored_goals,
       COALESCE(SUM(CASE WHEN team = 'white' THEN own_goals ELSE 0 END), 0) AS white_own_goals,
       COALESCE(SUM(CASE WHEN team = 'colored' THEN own_goals ELSE 0 END), 0) AS colored_own_goals
     FROM match_players
     WHERE match_id = ?`,[e]),a=Number(s?.white_goals??0)+Number(s?.colored_own_goals??0),t=Number(s?.colored_goals??0)+Number(s?.white_own_goals??0);await _(`UPDATE matches
     SET white_score = ?, colored_score = ?, result_type = ?
     WHERE id = ?`,[a,t,f(a,t),e])}async function b(e){await _("DELETE FROM matches WHERE id = ?",[e])}async function v(e){return(await _(`INSERT INTO match_players (match_id, player_id, team, goals, assists, own_goals, rating, is_mvp, is_attacking_mvp, is_defensive_mvp, comment, lineup_position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       team = VALUES(team),
       goals = VALUES(goals),
       assists = VALUES(assists),
       own_goals = VALUES(own_goals),
       rating = VALUES(rating),
       is_mvp = VALUES(is_mvp),
       is_attacking_mvp = VALUES(is_attacking_mvp),
       is_defensive_mvp = VALUES(is_defensive_mvp),
       comment = VALUES(comment),
       lineup_position = VALUES(lineup_position)`,[e.match_id,e.player_id,e.team,e.goals??0,e.assists??0,e.own_goals??0,e.rating??null,e.is_mvp?1:0,e.is_attacking_mvp?1:0,e.is_defensive_mvp?1:0,e.comment??null,e.lineup_position??null])).insertId}async function W(e,s){let a=[],t=[];for(let[e,n]of Object.entries(s))void 0!==n&&("is_mvp"===e||"is_attacking_mvp"===e||"is_defensive_mvp"===e?(a.push(`${e} = ?`),t.push(n?1:0)):(a.push(`${e} = ?`),t.push(n)));a.length&&(t.push(e),await _(`UPDATE match_players SET ${a.join(", ")} WHERE id = ?`,t))}async function U(e){await _("DELETE FROM match_players WHERE id = ?",[e])}async function I(e){let s=o(`SELECT
       COUNT(DISTINCT YEARWEEK(played_at, 3)) AS counted_weeks
     FROM matches
     WHERE season_id = ?
       AND is_counted = 1
       AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()`,[e]),a=`
    SELECT
      p.id AS player_id,
      p.display_name,
      p.nickname,
      p.slug,
      p.photo_url,
      p.skill_total,
      COUNT(s.mp_id) AS matches_played,
      SUM(CASE WHEN s.is_counted = 1 THEN 1 ELSE 0 END) AS counted_matches,
      COALESCE(SUM(s.goals), 0) AS goals,
      COALESCE(SUM(s.assists), 0) AS assists,
      COALESCE(SUM(s.own_goals), 0) AS own_goals,
      AVG(s.rating) AS rating_average,
      SUM(CASE
        WHEN s.is_counted = 1 AND (
          (s.team = 'white'   AND s.result_type = 'white_win') OR
          (s.team = 'colored' AND s.result_type = 'colored_win')
        ) THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN s.is_counted = 1 AND s.result_type = 'draw' THEN 1 ELSE 0 END) AS draws,
      SUM(CASE
        WHEN s.is_counted = 1 AND (
          (s.team = 'white'   AND s.result_type = 'colored_win') OR
          (s.team = 'colored' AND s.result_type = 'white_win')
        ) THEN 1 ELSE 0 END) AS losses
    FROM players p
    LEFT JOIN (
      SELECT
        mp.id AS mp_id,
        mp.player_id,
        mp.team,
        mp.goals,
        mp.assists,
        mp.own_goals,
        mp.rating,
        m.is_counted,
        m.result_type
      FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      WHERE m.season_id = ?
        AND m.is_counted = 1
        AND DATE_ADD(m.played_at, INTERVAL 1 HOUR) <= NOW()
    ) s ON s.player_id = p.id
    GROUP BY p.id
    HAVING COUNT(s.mp_id) > 0
  `,t=`
    SELECT
      mp.player_id,
      YEARWEEK(m.played_at, 3) AS week_key,
      COUNT(*) AS appearances,
      COALESCE(SUM(mp.goals), 0) AS goals,
      COALESCE(SUM(mp.assists), 0) AS assists,
      COALESCE(SUM(mp.is_mvp), 0) AS legacy_match_mvp_count,
      MAX(mp.is_attacking_mvp) AS attack_mvp_awarded,
      MAX(mp.is_defensive_mvp) AS defense_mvp_awarded,
      SUM(CASE
        WHEN (mp.team = 'white' AND m.result_type = 'white_win') OR
             (mp.team = 'colored' AND m.result_type = 'colored_win')
        THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN m.result_type = 'draw' THEN 1 ELSE 0 END) AS draws,
      SUM(CASE
        WHEN (mp.team = 'white' AND m.result_type = 'colored_win') OR
             (mp.team = 'colored' AND m.result_type = 'white_win')
        THEN 1 ELSE 0 END) AS losses
    FROM match_players mp
    JOIN matches m ON m.id = mp.match_id
    WHERE m.season_id = ?
      AND m.is_counted = 1
      AND DATE_ADD(m.played_at, INTERVAL 1 HOUR) <= NOW()
    GROUP BY mp.player_id, YEARWEEK(m.played_at, 3)
  `,[n,i,_]=await Promise.all([s,l(a,[e]),l(t,[e])]),r=Number(n?.counted_weeks??0),E=new Map;for(let e of _){let s=Number(e.player_id),a=Number(e.appearances||0);if(0===a)continue;let t=(5*Number(e.wins||0)+2*Number(e.draws||0)+1.5*Number(e.goals||0)+1*Number(e.assists||0)+3*Number(e.legacy_match_mvp_count||0)-2*Number(e.losses||0))/a,n=Number(e.attack_mvp_awarded||0),i=Number(e.defense_mvp_awarded||0),l=t+3*n+3*i,o=E.get(s)??{weeks:0,score:0,attackMvps:0,defenseMvps:0};o.weeks+=1,o.score+=l,o.attackMvps+=n,o.defenseMvps+=i,E.set(s,o)}return i.map(e=>{let s=Number(e.goals||0),a=Number(e.assists||0),t=Number(e.own_goals||0),n=Number(e.wins||0),i=Number(e.draws||0),l=Number(e.losses||0),o=Number(e.counted_matches||0),_=Number(e.matches_played||0),c=3*n+i,m=s+a,p=E.get(Number(e.player_id))??{weeks:0,score:0,attackMvps:0,defenseMvps:0},u=r>0?p.weeks/r:0,d=p.score+.5*u;return{player_id:Number(e.player_id),display_name:String(e.display_name),nickname:e.nickname??null,slug:String(e.slug),photo_url:e.photo_url??null,skill_total:Number(e.skill_total||0),matches_played:_,counted_matches:o,counted_weeks:p.weeks,attack_mvp_count:p.attackMvps,defense_mvp_count:p.defenseMvps,goals:s,assists:a,own_goals:t,wins:n,draws:i,losses:l,points:c,goals_per_match:o>0?s/o:0,assists_per_match:o>0?a/o:0,goals_plus_assists:m,goals_plus_assists_per_match:o>0?m/o:0,points_per_match:o>0?c/o:0,mvp_score:d}})}async function F(e,s){return(await I(s)).find(s=>s.player_id===e)??null}async function B(e,s){return l(`SELECT mp.*, m.match_number, m.played_at, m.white_score, m.colored_score, m.result_type, m.is_counted, m.id as match_id
     FROM match_players mp
     JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = ? AND m.season_id = ?
     ORDER BY m.played_at DESC, m.id DESC`,[e,s])}async function Y(e,s){return l("SELECT * FROM awards WHERE player_id = ? AND season_id = ? ORDER BY created_at DESC",[e,s])}async function V(){return l(`SELECT a.*, s.name AS season_name
     FROM awards a
     JOIN seasons s ON s.id = a.season_id
     ORDER BY s.starts_at DESC, a.created_at DESC`)}function P(e){let s=new Map;for(let a of e){let e=s.get(a.player_id)??[];e.push(a),s.set(a.player_id,e)}return s}async function J(e){return l(`SELECT
       h.*,
       p.display_name,
       p.nickname,
       p.slug,
       p.photo_url,
       p.skill_total
     FROM historical_player_stats h
     JOIN players p ON p.id = h.player_id
     WHERE h.season_id = ?
     ORDER BY h.points DESC, h.goals DESC, p.display_name ASC`,[e])}async function $(){return o(`SELECT s.* FROM seasons s
     LEFT JOIN historical_player_stats h ON h.season_id = s.id
     GROUP BY s.id
     ORDER BY COUNT(h.id) DESC, s.starts_at DESC
     LIMIT 1`)}async function j(e){return l(`SELECT h.*, s.name AS season_name,
            p.display_name, p.nickname, p.slug, p.photo_url, p.skill_total
     FROM historical_player_stats h
     JOIN seasons s ON s.id = h.season_id
     JOIN players p ON p.id = h.player_id
     WHERE h.player_id = ?
     ORDER BY s.starts_at DESC, s.id DESC`,[e])}async function K(){return l("SELECT * FROM gallery_images ORDER BY created_at DESC, id DESC")}async function x(e){return o("SELECT * FROM gallery_images WHERE id = ?",[e])}async function G(e){return(await _("INSERT INTO gallery_images (image_url, title) VALUES (?, ?)",[e.image_url,e.title??null])).insertId}async function q(e){await _("DELETE FROM gallery_images WHERE id = ?",[e])}async function X(e=200){return l("SELECT * FROM beer_donations ORDER BY donated_at DESC, id DESC LIMIT ?",[e])}async function z(e=100){return l("SELECT * FROM beer_donations WHERE is_public = 1 ORDER BY donated_at DESC, id DESC LIMIT ?",[e])}async function Z(){let e=await o("SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM beer_donations WHERE is_public = 1");return{total:Number(e?.total??0),count:Number(e?.count??0)}}async function Q(e){return(await _("INSERT INTO beer_donations (donor_name, amount, message, donated_at, is_public) VALUES (?, ?, ?, ?, ?)",[e.donor_name,e.amount,e.message??null,e.donated_at,!1===e.is_public?0:1])).insertId}async function ee(e){await _("DELETE FROM beer_donations WHERE id = ?",[e])}}};