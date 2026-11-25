const PORT = 9001
const URLDB = 'mongodb://127.0.0.1:27017/test'

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const config = require('./config')
const { secret } = config

const User = require('./models/User')
const Product = require('./models/Product')
const Basket = require('./models/Basket')
const Order = require('./models/Order')

const app = express()

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// ---------- JWT ----------
const generateAccessToken = (id) =>
    jwt.sign({ id }, secret, { expiresIn: '24h' })

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Не авторизован' })
    try {
        const decoded = jwt.verify(token, secret)
        req.userId = decoded.id          // ← именно userId, везде ниже используем его
        next()
    } catch (e) {
        res.status(401).json({ message: 'Не авторизован' })
    }
}

// ---------- Уведомление о заказе через Formspree ----------
async function sendOrderNotification(order) {
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/meeblvvz';

    try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: order.fullName,
                email: order.email,
                phone: order.phone,
                address: order.address,
                products: order.products
                    .map(p => `${p.header} — ${p.price} руб.`)
                    .join('\n'),
                orderDate: new Date().toLocaleString('ru-RU')
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Formspree error:', response.status, errText);
        } else {
            console.log('Formspree: уведомление отправлено');
        }
    } catch (err) {
        console.error('Formspree: запрос не удался:', err);
    }
}

// ---------- Регистрация / вход ----------
app.post('/registration', async (req, res) => {
    try {
        const { login, password, email } = req.body
        const user = new User({ login, password, email })
        await user.save()
        res.json({ message: 'Добро пожаловать!' })
    } catch (e) {
        res.status(400).json({ message: 'Ошибка регистрации' })
    }
})

app.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body
        const user = await User.findOne({ login })
        if (!user) return res.status(400).json({ message: 'Пользователь не найден' })
        if (user.password !== password) return res.status(400).json({ message: 'Неверный логин или пароль' })
        const token = generateAccessToken(user._id)
        res.json({ message: 'Рады видеть Вас!', token })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// ---------- Товары ----------
// ВАЖНО: отдаём массив, чтобы Main.js делал setProducts(result), а не result.data
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find()
        res.json(products)              // ← массив
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// ---------- Корзина ----------
// Добавить товар
app.post('/basket/add', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body
        let basket = await Basket.findOne({ user: req.userId })

        if (!basket) {
            basket = new Basket({
                user: req.userId,
                products: [productId]
            })
        } else {
            basket.products.push(productId)
        }
        await basket.save()
        res.json({ message: 'Товар добавлен в корзину' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// Получить корзину — отдаём { products: [...] } под ваш Basket.js
app.get('/basket', authMiddleware, async (req, res) => {
    try {
        const basket = await Basket
            .findOne({ user: req.userId })
            .populate('products')
        res.json({ products: basket?.products || [] })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})
// Удалить один экземпляр товара из корзины
app.post('/basket/remove', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body
        const basket = await Basket.findOne({ user: req.userId })

        if (!basket) {
            return res.status(400).json({ message: 'Корзина не найдена' })
        }

        const idx = basket.products.findIndex(
            p => p.toString() === productId
        )

        if (idx === -1) {
            return res.status(400).json({ message: 'Товар не найден в корзине' })
        }

        basket.products.splice(idx, 1)   // удаляем ровно один экземпляр

        // Если корзина опустела — можно удалить документ целиком
        if (basket.products.length === 0) {
            await Basket.deleteOne({ _id: basket._id })
        } else {
            await basket.save()
        }

        res.json({ message: 'Товар удалён из корзины' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// Оформить заказ
app.post('/order', authMiddleware, async (req, res) => {
    try {
        const { fullName, address, email, phone } = req.body

        const basket = await Basket
            .findOne({ user: req.userId })
            .populate('products')

        if (!basket || basket.products.length === 0) {
            return res.status(400).json({ message: 'Корзина пуста' })
        }

        const order = new Order({
            user: req.userId,
            products: basket.products.map(p => p._id),
            fullName,
            address,
            email,
            phone
        })
        await order.save()
        await Basket.deleteOne({ _id: basket._id })

        // Отправляем уведомление (await — чтобы успеть до ответа клиенту)
        await sendOrderNotification({
            fullName,
            email,
            phone,
            address,
            products: basket.products   // populate уже сделан
        })

        res.json({ message: 'Ваш заказ принят!' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// ---------- Запуск ----------
const start = async () => {
    try {
        await mongoose.connect(URLDB)
        app.listen(PORT, () => console.log(`Сервер запущен на ${PORT} порте`))
    } catch (e) {
        console.log(e)
    }
}
start()