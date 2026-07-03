/**
 * Seeds demo data: admin, clients, artisans (Koforidua), services, bookings, reviews.
 * Usage: npm run db:seed
 *
 * Default login passwords are all: Passw0rd!
 */
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

const PASSWORD = 'Passw0rd!';

const TRADES = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Welder', 'Mason'];
const AREAS = [
  { name: 'Koforidua, Adweso', lat: 6.1056, lng: -0.2531 },
  { name: 'Koforidua, Srodae', lat: 6.0921, lng: -0.2603 },
  { name: 'Koforidua, Effiduase', lat: 6.0989, lng: -0.2389 },
  { name: 'Koforidua, Two Streams', lat: 6.0833, lng: -0.2667 },
  { name: 'Koforidua, Galloway', lat: 6.0944, lng: -0.2514 },
];

const FIRST = ['Kwame', 'Ama', 'Kojo', 'Akosua', 'Yaw', 'Abena', 'Kofi', 'Adwoa', 'Kwabena', 'Esi'];
const LAST = ['Mensah', 'Owusu', 'Asante', 'Boateng', 'Agyemang', 'Darko', 'Appiah', 'Frimpong'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function clear() {
  const tables = [
    'payments', 'reviews', 'bookings', 'services',
    'portfolio_images', 'otp_codes', 'notifications', 'artisans', 'users',
  ];
  await query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of tables) await query(`TRUNCATE TABLE ${t}`);
  await query('SET FOREIGN_KEY_CHECKS = 1');
}

async function createUser({ name, email, phone, role }) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const r = await query(
    'INSERT INTO users (name, email, phone, password, role, is_phone_verified) VALUES (:name,:email,:phone,:pw,:role,1)',
    { name, email, phone, pw: hash, role }
  );
  return r.insertId;
}

async function run() {
  console.log('Clearing existing data ...');
  await clear();

  // Admin
  await createUser({ name: 'Platform Admin', email: 'admin@artisan.gh', phone: '0240000000', role: 'admin' });

  // Clients
  const clientIds = [];
  for (let i = 1; i <= 5; i++) {
    const id = await createUser({
      name: `${rand(FIRST)} ${rand(LAST)}`,
      email: `client${i}@artisan.gh`,
      phone: `02410000${String(i).padStart(2, '0')}`,
      role: 'client',
    });
    await query('UPDATE users SET avatar_url = :url WHERE id = :id', {
      url: `https://i.pravatar.cc/200?img=${50 + i}`,
      id,
    });
    clientIds.push(id);
  }

  // Artisans
  const artisanIds = [];
  for (let i = 1; i <= 14; i++) {
    const area = rand(AREAS);
    const trade = rand(TRADES);
    const userId = await createUser({
      name: `${rand(FIRST)} ${rand(LAST)}`,
      email: `artisan${i}@artisan.gh`,
      phone: `05420000${String(i).padStart(2, '0')}`,
      role: 'artisan',
    });
    const r = await query(
      `INSERT INTO artisans (user_id, trade, experience, location, latitude, longitude, bio, hourly_rate, availability, is_approved, whatsapp)
       VALUES (:uid,:trade,:exp,:loc,:lat,:lng,:bio,:rate,:avail,:approved,:wa)`,
      {
        uid: userId,
        trade,
        exp: randInt(1, 18),
        loc: area.name,
        lat: area.lat,
        lng: area.lng,
        bio: `Experienced ${trade.toLowerCase()} serving the Koforidua municipality. Reliable, neat and affordable.`,
        rate: randInt(30, 120),
        avail: rand(['available', 'available', 'busy', 'offline']),
        approved: i <= 11 ? 1 : 0, // leave a few pending for the admin demo
        wa: `23354200000${i}`,
      }
    );
    const artisanId = r.insertId;
    artisanIds.push({ artisanId, userId, trade });

    // Demo avatar (external placeholder service)
    await query('UPDATE users SET avatar_url = :url WHERE id = :id', {
      url: `https://i.pravatar.cc/200?img=${((i * 3) % 70) + 1}`,
      id: userId,
    });

    // Portfolio: a before/after pair + a couple of general shots
    const shots = [
      { kind: 'before', caption: 'Before the job' },
      { kind: 'after', caption: 'After completion' },
      { kind: 'general', caption: 'On site' },
      { kind: 'general', caption: 'Finished work' },
    ];
    for (let s = 0; s < shots.length; s++) {
      await query(
        'INSERT INTO portfolio_images (artisan_id, image_url, caption, kind) VALUES (:id, :url, :cap, :kind)',
        {
          id: artisanId,
          url: `https://picsum.photos/seed/art${artisanId}-${s}/500/360`,
          cap: shots[s].caption,
          kind: shots[s].kind,
        }
      );
    }

    // Services
    await query(
      'INSERT INTO services (artisan_id, service_name, description, price) VALUES (:id,:n,:d,:p)',
      { id: artisanId, n: `${trade} - General work`, d: 'Standard call-out and labour.', p: randInt(50, 300) }
    );
    await query(
      'INSERT INTO services (artisan_id, service_name, description, price) VALUES (:id,:n,:d,:p)',
      { id: artisanId, n: `${trade} - Emergency`, d: 'Priority same-day response.', p: randInt(100, 500) }
    );
  }

  // Bookings + reviews
  const statuses = ['pending', 'accepted', 'completed', 'completed', 'rejected', 'cancelled'];
  for (let i = 0; i < 30; i++) {
    const client = rand(clientIds);
    const artisan = rand(artisanIds.filter((a) => a.artisanId));
    const status = rand(statuses);
    const amount = randInt(60, 400);
    const date = new Date(Date.now() + randInt(-30, 20) * 86400000).toISOString().slice(0, 10);

    const r = await query(
      `INSERT INTO bookings (client_id, artisan_id, booking_date, booking_time, description, address, status, amount)
       VALUES (:c,:a,:d,'10:00:00',:desc,'House number near the area',:s,:amt)`,
      { c: client, a: artisan.artisanId, d: date, desc: `Need a ${artisan.trade.toLowerCase()} for some work.`, s: status, amt: amount }
    );

    if (status === 'completed') {
      await query('UPDATE artisans SET jobs_completed = jobs_completed + 1 WHERE id = :id', { id: artisan.artisanId });
      // ~70% of completed get reviewed
      if (Math.random() < 0.7) {
        const rating = randInt(3, 5);
        await query(
          'INSERT INTO reviews (booking_id, client_id, artisan_id, rating, comment) VALUES (:b,:c,:a,:r,:cm)',
          { b: r.insertId, c: client, a: artisan.artisanId, r: rating, cm: rand([
            'Great work, very professional.',
            'Came on time and did a clean job.',
            'Affordable and reliable.',
            'Highly recommend for Koforidua residents.',
            'Good service overall.',
          ]) }
        );
      }
    }
  }

  // Recompute ratings
  const allArtisans = await query('SELECT id FROM artisans');
  for (const a of allArtisans) {
    const agg = await query(
      'SELECT COALESCE(AVG(rating),0) AS avg, COUNT(*) AS cnt FROM reviews WHERE artisan_id = :id AND is_hidden = 0',
      { id: a.id }
    );
    await query('UPDATE artisans SET rating = :avg, rating_count = :cnt WHERE id = :id', {
      avg: Number(agg[0].avg).toFixed(2),
      cnt: agg[0].cnt,
      id: a.id,
    });
  }

  console.log('✓ Seed complete');
  console.log('  Admin:   admin@artisan.gh  /  ' + PASSWORD);
  console.log('  Client:  client1@artisan.gh /  ' + PASSWORD);
  console.log('  Artisan: artisan1@artisan.gh / ' + PASSWORD);
  await pool.end();
}

run().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
