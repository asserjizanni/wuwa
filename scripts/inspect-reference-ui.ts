import fs from 'fs';

async function inspect() {
  const res = await fetch('https://arabwuwa.com/ar/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  fs.writeFileSync('data_source/arabwuwa_home.html', html);
  console.log('Saved data_source/arabwuwa_home.html! Length:', html.length);

  // Extract navigation
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  if (navMatch) {
    console.log('\n--- NAV ---');
    const links = [...navMatch[1].matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const l of links) {
      console.log(l[1], '-->', l[2].replace(/<[^>]*>/g, '').trim());
    }
  }

  // Extract main headings and cards
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  console.log('\n--- H2 HEADINGS ---');
  for (const h of h2s) {
    console.log(h[1].replace(/<[^>]*>/g, '').trim());
  }

  // Check CSS links
  const css = [...html.matchAll(/href="([^"]*\.css[^"]*)"/gi)];
  console.log('\n--- CSS FILES ---');
  for (const c of css) {
    console.log(c[1]);
  }
}

inspect().catch(console.error);
