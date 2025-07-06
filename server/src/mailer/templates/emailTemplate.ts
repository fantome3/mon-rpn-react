export function emailTemplate({
  content,
  presidentName = 'Nom du Président',
  phone = '+1 (XXX) XXX-XXXX',
}: {
  content: string
  presidentName?: string
  phone?: string
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      background-color: #f2f2f2;
      font-family: Arial, sans-serif;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header img {
      max-width: 100%;
    }
    .logo-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 5px;
      margin-bottom: 10px;
    }
    .logo-row img {
      height: 50px;
    }
    .association-name {
      font-size: 18px;
      font-weight: bold;
    }
    .content p {
      line-height: 1.6;
    }
    .signature {
      margin-top: 30px;
    }
    @media (max-width: 480px) {
      .logo-row {
        flex-direction: column;
      }
      .logo-row img {
        margin-bottom: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="cid:drapeau-cameroun.jpg" alt="Drapeau du Cameroun" />
    <div class="logo-row">
      <img src="cid:logo-Acq-jpeg.jpg" alt="Logo ACQ" />
      <div class="association-name">Association des Camerounaises et Camerounais de Québec (ACQ)</div>
      <img src="cid:amoirie-cameroun.jpg" alt="Armoiries du Cameroun" />
    </div>
  </div>
  <div class="container">
    <div class="content">${content}</div>
    <div class="signature">
      <p>${presidentName}<br/>Président de l’ACQ<br/>Tél. : ${phone}<br/>Email : contact@acq-quebec.org</p>
    </div>
  </div>
</body>
</html>`
}
