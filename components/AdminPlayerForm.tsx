'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPlayerAction, updatePlayerAction } from '@/app/admin/actions';
import { PlayerAvatar } from './PlayerAvatar';
import type { Player } from '@/lib/types';
import { calculateSkillTotal, PLAYER_SKILL_FIELDS, PLAYER_SKILL_LABELS, type PlayerSkillField } from '@/lib/playerSkills';

export function AdminPlayerForm({ player }: { player?: Player }) {
  const [pending, start] = useTransition();
  const action = player ? updatePlayerAction : createPlayerAction;

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(player?.photo_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [skills, setSkills] = useState<Record<PlayerSkillField, string>>(() =>
    Object.fromEntries(
      PLAYER_SKILL_FIELDS.map((field) => [field, player?.[field] == null ? '' : String(player[field])])
    ) as Record<PlayerSkillField, string>
  );
  const skillTotal = calculateSkillTotal(
    Object.fromEntries(
      PLAYER_SKILL_FIELDS.map((field) => [field, skills[field] === '' ? null : Number(skills[field])])
    ) as Record<PlayerSkillField, number | null>
  );

  // Oslobodi objectURL kada se promeni / odmontira
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Molim izaberi sliku (jpg, png, webp…).');
      e.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Slika je prevelika (maks. 8 MB).');
      e.target.value = '';
      return;
    }
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setRemovePhoto(false);
  }

  function clearPhoto() {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setRemovePhoto(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  function updateSkill(field: PlayerSkillField, value: string) {
    setSkills((current) => ({ ...current, [field]: value }));
  }

  return (
    <form
      action={(fd) => start(() => action(fd))}
      className="space-y-3 text-sm"
    >
      {player && <input type="hidden" name="id" value={player.id} />}
      {player && <input type="hidden" name="existing_photo_url" value={player.photo_url ?? ''} />}
      {removePhoto && <input type="hidden" name="remove_photo" value="on" />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="stat-label">Ime</label>
          <input name="first_name" className="input mt-1" required defaultValue={player?.first_name} />
        </div>
        <div>
          <label className="stat-label">Prezime</label>
          <input name="last_name" className="input mt-1" required defaultValue={player?.last_name} />
        </div>
      </div>

      <div>
        <label className="stat-label">Display ime (opciono)</label>
        <input name="display_name" className="input mt-1" defaultValue={player?.display_name} placeholder="npr. Nikolić Miloš" />
      </div>

      <div>
        <label className="stat-label">Nadimak</label>
        <input name="nickname" className="input mt-1" defaultValue={player?.nickname ?? ''} />
      </div>

      {/* FOTOGRAFIJA — upload sa računara */}
      <div>
        <label className="stat-label">Fotografija igrača</label>
        <div className="mt-1.5 flex items-center gap-4">
          <div className="shrink-0">
            <PlayerAvatar name={player?.display_name || 'Novi igrač'} photoUrl={preview} size={64} />
          </div>
          <div className="flex-1 min-w-0">
            <input
              ref={fileRef}
              type="file"
              name="photo_file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFile}
              className="hidden"
              id="photo_file_input"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-ghost px-3 py-2 text-xs"
              >
                {preview ? 'Promeni sliku' : 'Izaberi sliku…'}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-xs text-danger hover:underline"
                >
                  Ukloni
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1.5 truncate">
              {fileName ? fileName : 'JPG, PNG, WEBP — do 8 MB. Slika se čuva na server.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="stat-label">Pozicija</label>
        <input name="position" className="input mt-1" defaultValue={player?.position ?? ''} placeholder="GK / DEF / MID / NAP" />
      </div>

      <div className="rounded-xl border border-border/70 bg-background/35 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="stat-label">Statistički parametri</div>
            <div className="mt-1 text-sm font-semibold text-text">Ocene igrača</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Total</div>
            <div className="font-display text-xl font-bold tabular-nums text-warning">{skillTotal}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PLAYER_SKILL_FIELDS.map((field) => (
            <label key={field} className="block">
              <span className="stat-label">{PLAYER_SKILL_LABELS[field]}</span>
              <input
                name={field}
                type="number"
                inputMode="numeric"
                step="1"
                min="-10"
                max="10"
                className="input mt-1"
                value={skills[field]}
                onChange={(event) => updateSkill(field, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={player ? player.is_active === 1 : true}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm">Aktivan igrač</span>
      </label>

      <button className="btn-primary w-full" disabled={pending}>
        {pending ? 'Čuvanje…' : player ? 'Sačuvaj izmene' : 'Dodaj igrača'}
      </button>
    </form>
  );
}
