# Galerija — slike

Ovde se čuvaju slike otpremljene kroz admin Galeriju (`/admin/gallery`).

- Fajlovi se snimaju automatski pri uploadu; ime je `<timestamp>-<rand>.<ext>`.
- Slike se serviraju preko rute `/images/gallery/<fajl>` (route handler čita sa
  diska — pouzdano i u `output: 'standalone'` režimu).
- Za trajnost preko redeploy-a na produkciji, postavi env `GALLERY_DIR` na
  apsolutnu, upisivu putanju van build outputa.
