export function emailTemplate({
  content,
  presidentName = 'Nguewou DZalli Ghislain Brice',
  phone = '+1(438) 830-6931',
}: {
  content: string
  presidentName?: string
  phone?: string
}): string {
  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="background-color: #f2f2f2; font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:drapeau-cameroun.jpg" alt="Drapeau du Cameroun" style="max-width: 100%; height: auto; border-radius: 5px;" />
        </div>

        <!-- Logo + Titre + Armoiries -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; text-align: center; margin-bottom: 20px;">
          <img src="cid:logo-Acq-jpeg.jpg" alt="Logo ACQ" style="height: 50px; margin: 5px auto;" />
          <div style="flex: 1; font-size: 18px; font-weight: bold; padding: 10px;">
            Association des Camerounaises et Camerounais de Québec (ACQ)
          </div>
          <img src="cid:amoirie-cameroun.jpg" alt="Armoiries du Cameroun" style="height: 50px; margin: 5px auto;" />
        </div>

        <div>
          ${content}
        </div>

        <div style="margin-top: 30px;">
          <p style="line-height: 1.6;">
            ${presidentName}<br/>
            Président de l’ACQ<br/>
            Tél. : ${phone}<br/>
            Email : acq.quebec@gmail.com
          </p>
        </div>
      </div>
    </body>
  </html>`
}
