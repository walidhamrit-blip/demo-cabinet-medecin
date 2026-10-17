import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
const server = createServer(async (req,res) => { try { const path = join(process.cwd(),'dist',req.url === '/' ? 'index.html' : req.url.split('?')[0]); const data = await readFile(path); res.writeHead(200,{'Content-Type':mime[extname(path)] || 'application/octet-stream'}); res.end(data) } catch { res.writeHead(404);res.end() } })
await new Promise(resolve=>server.listen(4175,resolve))
const browser = await chromium.launch({headless:true})
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000}})
 const errors = [];page.on('pageerror',error=>errors.push(error.message))
 await page.goto('http://localhost:4175'); await page.evaluate(()=>document.fonts.ready)
 await page.screenshot({path:'/tmp/cabinet-desktop.png',fullPage:true})
 await page.getByRole('button',{name:'Prendre rendez-vous',exact:true}).first().click()
 await page.getByRole('button',{name:'09:30',exact:true}).click()
 await page.getByRole('button',{name:'Continuer',exact:true}).click()
 await page.getByLabel('Nom et prénom').fill('Test Patient')
 await page.getByLabel('Numéro de téléphone').fill('+212600000000')
 await page.locator('.consent input').check()
 await page.getByRole('button',{name:'Enregistrer ma réservation'}).click()
 await page.getByRole('heading',{name:'Votre réservation est enregistrée !'}).waitFor()
 const downloadPromise = page.waitForEvent('download'); await page.getByRole('button',{name:'Ajouter à mon agenda'}).click(); await downloadPromise
 await page.getByRole('button',{name:'Fermer',exact:true}).click(); await page.reload()
 await page.locator('.navigation').getByRole('button',{name:'Mes rendez-vous'}).click()
 await page.getByText('Test Patient',{exact:true}).waitFor()
 page.on('dialog',d=>d.accept()); await page.getByRole('button',{name:'Annuler',exact:true}).click()
 await page.getByText('Vous n’avez pas encore de rendez-vous enregistré.').waitFor()
 await page.getByRole('button',{name:'Fermer',exact:true}).click()
 await page.getByRole('button',{name:'Votre ambiance',exact:true}).click()
 for (const [label,theme] of [['Bleu océan','ocean'],['Lavande douce','lavender'],['Sable chaleureux','sand'],['Sauge naturelle','sage']]) { await page.getByRole('button',{name:label,exact:true}).click(); if(await page.locator('html').getAttribute('data-theme')!==theme)throw new Error('Theme failed') }
 await page.locator('.mode-btn').click(); if(!await page.locator('html').evaluate(el=>el.classList.contains('dark')))throw new Error('Dark mode failed')
 await page.locator('.mode-btn').click();await page.getByRole('button',{name:'Votre ambiance',exact:true}).click()
 await page.getByLabel('Choisir la langue').selectOption('en');await page.getByRole('heading',{name:'Your health, in trusted hands.'}).waitFor()
 await page.getByLabel('Choose language').selectOption('ar');if(await page.locator('html').getAttribute('dir')!=='rtl')throw new Error('RTL failed')
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/cabinet-ar-mobile.png',fullPage:true})
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Arabic mobile overflow')
 await page.getByLabel('اختر اللغة').selectOption('fr');await page.screenshot({path:'/tmp/cabinet-mobile.png',fullPage:true})
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('French mobile overflow')
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('.navigation').getByRole('button',{name:'Mes rendez-vous'}).click(); await page.getByRole('heading',{name:'Mes rendez-vous'}).waitFor()
 if(errors.length)throw new Error(errors.join('\n'))
 console.log('PASS: booking, calendar download, persistence, cancellation, 4 themes, dark mode, 3 languages, mobile menu, RTL, responsive layout, no browser errors.')
} finally { await browser.close();server.close() }
