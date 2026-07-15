const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const conditions = ['Новое', 'Б/У'];
const locations = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];
const categories = ['Электроника', 'Одежда и обувь', 'Мебель', 'Детские товары', 'Спорт и отдых', 'Книги', 'Для дома'];
const productNames = ['iPhone 13 Pro', 'Велосипед Stels', 'Диван угловой', 'Наушники Sony', 'Коляска Babyzen', 'Кроссовки Nike', 'Стол ИКЕА', 'Камера Canon', 'Книга Властелин колец', 'Гитара Yamaha', 'Пылесос Dyson', 'Куртка зимняя', 'Монитор LG', 'Кофемашина DeLonghi', 'Рюкзак Herschel'];
const emojis = ['📱','🚲','🛋️','🎧','👶','👟','🪑','📷','📖','🎸','🧹','🧥'];

async function seed() {
  const defaultData = { users: [], products: [], favorites: [] };
  const db = await JSONFilePreset(path.join(__dirname, 'db.json'), defaultData);

  const products = [];
  for (let i = 1; i <= 60; i++) {
    products.push({
      id: i,
      title: `${productNames[i % productNames.length]} ${i % 10 + 1}`,
      price: Math.floor(Math.random() * 90000 + 1000),
      image: emojis[i % emojis.length],
      location: locations[i % locations.length],
      condition: conditions[i % 2],
      category: categories[i % categories.length],
      description: 'Отличное состояние, полный комплект. Возможен небольшой торг. Причина продажи — покупка новой модели.',
      sellerId: null,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    });
  }

  db.data.products = products;
  db.data.users = [];
  db.data.favorites = [];
  await db.write();
  console.log(`✅ База наполнена: ${products.length} объявлений`);
}

seed();