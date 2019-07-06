$elph = Get-Content .\.clasp.elph.json -Encoding UTF8 -Raw | ConvertFrom-Json
$rose = Get-Content .\.clasp.rose.json -Encoding UTF8 -Raw | ConvertFrom-Json
$moen = Get-Content .\.clasp.moen.json -Encoding UTF8 -Raw | ConvertFrom-Json

clasp setting scriptId $elph.scriptId ; clasp push
clasp setting scriptId $rose.scriptId ; clasp push
clasp setting scriptId $moen.scriptId ; clasp push
