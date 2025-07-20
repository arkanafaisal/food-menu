const menuDatas = [
  {
    name: "cireng",
    price: [ '3k' ],
    stock: 'tersedia',
    extras: [
      {name: 'isi', type: "read", data: "ayam"}
    ],
    image: "cireng.png"
  },
  {
    name: "mochi",
    price: [ '2k' ],
    stock: 'tersedia',
    extras: [
      {name: 'rasa', type: 'read', data: 'coklat'}
    ],
    image: "mochi.png"
  },
  {
    name: 'es krim',
    price: [ '3k', '4k'],
    stock: 'tersedia',
    extras: [
      {name: 'ukuran', type: 'selectable', referencePrice: true, data: [ 'medium', 'big' ]},
      {name: 'topping', type: 'selectable', data: [ 'original', 'coklat', 'stroberi' ]}
    ]
  }
]


