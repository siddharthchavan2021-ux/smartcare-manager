$targetDir = "..\smartcare-manager"
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

New-Item -ItemType Directory -Path "$targetDir\frontend" -Force | Out-Null
& robocopy "..\smartcare-frontend" "$targetDir\frontend" /E /XD node_modules .git | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Robocopy frontend failed with exit code $LASTEXITCODE" }

New-Item -ItemType Directory -Path "$targetDir\backend" -Force | Out-Null
& robocopy ".\" "$targetDir\backend" /E /XD node_modules .git | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Robocopy backend failed with exit code $LASTEXITCODE" }

git -C $targetDir init
git -C $targetDir branch -M main

Set-Content -Path "$targetDir\.gitignore" -Value "node_modules/`n.env`n.DS_Store"

git -C $targetDir add .
git -C $targetDir commit -m "Initial commit with frontend and backend"
git -C $targetDir remote add origin https://github.com/siddharthchavan2021-ux/smartcare-manager.git
git -C $targetDir push -u origin main
