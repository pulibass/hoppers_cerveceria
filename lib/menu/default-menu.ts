import { MENU_VERSION, type BeerInfo, type Category, type MenuData, type PriceEntry, type Product } from "./types";

// Default content transcribed from "CARTA_HOPPERS_SEP 26.pdf" (5 pages).
// It is shown while Supabase has no saved menu, and is the seed the admin panel starts from.
// Doubtful readings and editorial decisions are listed in CONTENT_REVIEW.md.

type ProductInput = Partial<Omit<Product, "id" | "name">>;

const product = (id: string, name: string, price: number | null, extra: ProductInput = {}): Product => ({
  id, name, price,
  description: "", priceLabel: "", group: "", imageUrl: "", visible: true, available: true, tags: [], beer: null,
  ...extra,
});

const entry = (id: string, label: string, price: number | null, priceLabel = ""): PriceEntry => ({ id, label, price, priceLabel });

const beer = (id: string, name: string, info: BeerInfo): Product => product(id, name, null, { beer: info });

type CategoryInput = Omit<Category, "note" | "visible" | "priceList" | "notice"> & Partial<Pick<Category, "note" | "visible" | "priceList" | "notice">>;
const category = (input: CategoryInput): Category => ({ note: "", visible: true, priceList: [], notice: "none", ...input });

export const defaultMenu: MenuData = {
  version: MENU_VERSION,
  business: {
    name: "HÖPPERS",
    subtitle: "BEER EXPERIENCE",
    description: "Hacenos parte de tus mejores momentos.",
    address: "",
    hours: "",
    instagramUrl: "https://www.instagram.com/hoppers_cerveceria/",
    whatsappNumber: "543518063069",
    whatsappDisplay: "351 806-3069",
    alcoholNotice: "Beber con moderación. Prohibida su venta a menores de 18 años.",
    saltNotice: "El exceso de sal es perjudicial para la salud. Ley N.º 14.349.",
    closingTitle: "¿Cómo la estás pasando?",
    closingText: "Contanos tu experiencia por nuestros canales oficiales. Etiquetanos en tu selfie o fotos con tus allegados en nuestro Instagram.",
  },
  happyHour: {
    visible: true,
    title: "Happy Hour",
    description: "",
    schedule: "Todos los días de 17 a 20 h",
    payment: "Solo en efectivo",
    afterCategoryId: "cervezas-botella",
    items: [
      entry("hh-pinta", "Pinta", 5000),
      entry("hh-especiales", "Especiales", 5500),
      entry("hh-fernet", "Fernet", 6000),
      entry("hh-campari", "Campari", 6000),
      entry("hh-obrero", "Obrero Höppers", null, "2x1"),
    ],
  },
  categories: [
    category({
      id: "sin-alcohol", name: "Sin alcohol", layout: "list", tone: "verde", icon: "glass",
      items: [
        product("gaseosa", "Gaseosa", 4000, { description: "Línea Pepsi" }),
        product("agua-saborizada", "Agua saborizada", 4000),
        product("agua", "Agua con / sin gas", 4000),
        product("limonada", "Limonada de la casa", 5000),
        product("jarra-limonada", "Jarra de limonada 1 L", 10000),
        product("jarra-limonada-frutos-rojos", "Jarra de limonada con frutos rojos", 12000),
        product("corona-sin-alcohol", "Corona sin alcohol", 6000),
        product("gancia-cero", "Gancia 0.0", 6000),
      ],
    }),
    category({
      id: "gin-tonic", name: "Gin tonic", layout: "list", tone: "verde", icon: "gin", notice: "alcohol",
      note: "Limón | Pomelo | Pepino | Frutos rojos | Jengibre",
      items: [
        product("beefeater", "Beefeater", 10000),
        product("apostoles-mate", "Apóstoles Mate", 8000, { group: "Apóstoles Gin" }),
        product("apostoles-rosa-mosqueta", "Apóstoles Rosa Mosqueta", 8000, { group: "Apóstoles Gin" }),
      ],
    }),
    category({
      id: "whiskys", name: "Whiskys", layout: "list", tone: "ambar", icon: "whisky", notice: "alcohol",
      items: [
        product("johnnie-walker-black", "Johnnie Walker Black", 12000),
        product("johnnie-walker-red", "Johnnie Walker Red", 10000),
        product("jim-beam", "Jim Beam", 10000),
        product("jameson", "Jameson", 10000),
        product("tullamore-dew", "Tullamore Dew", 12000),
        product("jagermeister", "Jägermeister", 12000),
      ],
    }),
    category({
      id: "vinos", name: "Vinos", layout: "list", tone: "rojo", icon: "wine", notice: "alcohol",
      items: [
        product("las-perdices-malbec", "Las Perdices Malbec", 22000, { group: "Tintos" }),
        product("don-david-cabernet", "Don David Cabernet Sauvignon Reserva", 22000, { group: "Tintos" }),
        product("salentein-malbec", "Salentein Malbec", 22000, { group: "Tintos" }),
        product("salentein-cabernet-franc", "Salentein Cabernet Franc", 22000, { group: "Tintos" }),
        product("killka-malbec", "Killka Malbec", 20000, { group: "Tintos" }),
        product("fond-de-cave-petit-verdot", "Fond de Cave Reserva Petit Verdot", 18000, { group: "Tintos" }),
        product("intocables-red-blend", "Intocables Red Blend", 16000, { group: "Tintos" }),
        product("portillo-sauvignon-blanc", "Portillo Sauvignon Blanc", 16000, { group: "Blancos" }),
        product("alma-mora-blanco-dulce", "Alma Mora Blanco Dulce", 16000, { group: "Blancos" }),
        product("las-perdices-brut-rose", "Las Perdices Brut Rosé", 18000, { group: "Espumosos" }),
        product("las-perdices-extra-brut", "Las Perdices Extra Brut", 20000, { group: "Espumosos" }),
        product("vino-de-la-casa-copa", "Vino de la casa", 6000, { group: "Por copa", description: "Copa" }),
      ],
    }),
    category({
      id: "cervezas-tiradas", name: "Cervezas tiradas", layout: "beer", tone: "ambar", icon: "beer", notice: "alcohol",
      note: "IBU: unidad internacional de amargor · Gr. ol.: graduación alcohólica.",
      priceList: [
        entry("pinta", "Pinta", 6000),
        entry("media-pinta", "Media pinta", 3500),
        entry("especiales", "Especiales", 7000),
        entry("media-especiales", "Media especiales", 4000),
      ],
      items: [
        beer("golden", "Golden", { brewery: "Bier Republik", color: "Dorada", aroma: "Afrutada, cereal", finish: "Suave | fresca", abv: 5, ibu: 17 }),
        beer("stout", "Stout", { brewery: "Walmunz", color: "Oscura e intensa", aroma: "Café tostado y chocolate", finish: "Dulce y amargo, final suave", abv: 7.4, ibu: 65 }),
        beer("woody", "Woody", { brewery: "Bier Republik", color: "Carmesí", aroma: "Torrado | madera", finish: "Barrica de roble", abv: 5.5, ibu: 25 }),
        beer("red-scotch", "Red Scotch", { brewery: "Walmunz", color: "Rubí", aroma: "Caramelizado suave", finish: "Torrado, dulce | suave", abv: 6, ibu: 18 }),
        beer("apa", "APA", { brewery: "Fermentum", color: "Dorado pálido", aroma: "Lúpulo moderado a intenso", finish: "Cítrico | pino, aspecto frutal", abv: 5.5, ibu: 33 }),
        beer("ipa", "IPA", { brewery: "Träumer Beer", color: "Ámbar", aroma: "Notas cítricas", finish: "Amargo cítrico fuerte", abv: 5.5, ibu: 46 }),
        beer("barley-wine", "Barley Wine", { brewery: "Walmunz", color: "Dorada oscura", aroma: "Caramelo", finish: "Alcohólica", abv: 10, ibu: 25 }),
        beer("honey", "Honey", { brewery: "Bier Republik", color: "Dorado intenso", aroma: "Miel sutil", finish: "Miel, cereal", abv: 5.6, ibu: 22 }),
        beer("red-fruit", "Red Fruit", { brewery: "Brewers", color: "Rojo brillante", aroma: "Frutos rojos", finish: "Frutilla | arándanos", abv: 4.5, ibu: 14 }),
        beer("vera-ipa", "Vera IPA", { brewery: "Patagonia", color: "Dorado / anaranjado profundo", aroma: "Cítricos y frutas tropicales", finish: "Amargor bajo", abv: 5.8, ibu: 20 }),
      ],
    }),
    category({
      id: "cervezas-botella", name: "Cervezas en botella", layout: "list", tone: "ambar", icon: "bottle", notice: "alcohol",
      items: [
        product("corona-330", "Corona 330 cc", 6000),
        product("corona-sin-alcohol-botella", "Corona sin alcohol", 6000, { tags: ["Sin alcohol"] }),
        product("michelob-gluten-free", "Michelob Gluten Free", 6000, { tags: ["Sin gluten"] }),
      ],
    }),
    category({
      id: "cocktails", name: "Cocktails", layout: "list", tone: "verde", icon: "cocktail", notice: "alcohol",
      items: [
        product("fernet-branca", "Fernet Branca", 8000, { description: "Medida de 500 cc" }),
        product("jarra-fernet", "Jarra de Fernet", 15000, { description: "1 litro" }),
        product("vermouth-federal", "Vermouth Federal", 5500),
        product("aperol-spritz", "Aperol Spritz", 8000),
        product("campari", "Campari", 8000, { description: "Orange / Tonic" }),
        product("jarra-campari", "Jarra de Campari", 15000, { description: "1 litro" }),
        product("cynar-julep", "Cynar Julep", 8000),
        product("gancia", "Gancia", 7000),
        product("jarra-gancia", "Jarra de Gancia", 13000),
        product("negroni-federal", "Negroni Federal", 8000),
        product("mojito", "Mojito", 8000),
        product("obrero-hoppers", "Obrero Höppers", 6500, { description: "Amargo Obrero y gaseosa pomelo" }),
        product("mojito-malibu", "Mojito Malibú", 8000),
        product("caipiroska", "Caipiroska", 8000),
        product("caipirinha", "Caipirinha", 8000),
        product("cuba-libre", "Cuba Libre", 8000),
        product("daiquiri", "Daiquiri", 8000),
        product("paloma-mexicana", "Paloma Mexicana", 7000),
        product("baileys-boom", "Baileys Boom", 9000),
        product("ron-bacardi-7", "Ron Bacardí 7 años", 10000, { description: "Cuba Libre" }),
        product("smirnoff-saborizado", "Smirnoff saborizado", 9000),
        product("smirnoff-red-bull", "Smirnoff con Red Bull", 15000),
        product("toc-toc", "Toc Toc", 6000),
        product("red-bull", "Red Bull", 6000),
      ],
    }),
    category({
      id: "papas", name: "Papas", layout: "cards", tone: "ambar", icon: "fries", notice: "salt",
      items: [
        product("papas-baston", "Papas bastón", 12000, { description: "Papas bastón con Ali Oli." }),
        product("papas-bravas", "Papas bravas", 12000, { description: "Papas bastón (salsa picante aparte)." }),
        product("papas-cheddar", "Papas cheddar", 15000, { description: "Papas bastón bañadas en queso cheddar fundido con panceta crocante y verdeo." }),
        product("papas-4-quesos", "Papas 4 quesos", 14000, { description: "Papas en bastón bañadas en queso Tybo, azul, fontina y cheddar." }),
        product("papas-hoppers", "Papas Höppers", 14000, { description: "Papas con salsa de 4 quesos, jamón y verdeo." }),
        product("extra-papas", "Extra papas 300 g", 6000),
      ],
    }),
    category({
      id: "para-picar", name: "Para picar", layout: "cards", tone: "rojo", icon: "snack", notice: "salt",
      items: [
        product("bastoncitos-mozzarella", "Bastoncitos de mozzarella", 12000, { description: "Bastones de mozzarella rebozados fritos (5)." }),
        product("pinchos-pollo", "Pinchos de pollo", 14000, { description: "Pollo rebozado frito con salsa barbacoa Hö y alioli (3)." }),
        product("pica-milanga", "Pica milanga", 16000, { description: "Tiras de milanesa de pollo o ternera con papas, dips de barbacoa y alioli." }),
        product("plato-de-mar", "Plato de mar", 25000, { description: "Rabas y cornalitos acompañados de papa gajo, limón y alioli." }),
      ],
    }),
    category({
      id: "pizzetas", name: "Pizzetas", layout: "cards", tone: "rojo", icon: "pizza", notice: "salt",
      items: [
        product("pizzeta-hoppers", "Höppers", 14000, { description: "Mozzarella, cheddar, panceta crocante y olivas negras." }),
        product("pizzeta-rucula", "Rúcula", 14000, { description: "Mozzarella, rúcula, jamón crudo, reducción de aceto con miel y olivas negras." }),
        product("pizzeta-vegana", "Vegana", 15000, { description: "Mozzarella de almendras, zanahorias, zucchini, cebolla caramelizada, pimientos, champignon, tomates rehidratados y olivas negras.", tags: ["Vegana"] }),
        product("pizzeta-napolitana", "Napolitana", 12000, { description: "Mozzarella, tomate y albahaca fresca." }),
        product("pizzeta-muzza-anchoas", "Muzza con anchoas", 12000, { description: "Salsa de tomates y mozzarella + anchoas." }),
        product("pizzeta-especial-jamon", "Especial con jamón", 14000, { description: "Mozzarella, tomate natural, jamón cocido y pimientos asados." }),
      ],
    }),
    category({
      id: "burgers", name: "Burgers", layout: "cards", tone: "rojo", icon: "burger", notice: "salt",
      note: "Todas incluyen acompañamiento de papas bastón.",
      items: [
        product("burger-hoppers", "Höppers", 14000, { description: "Pan de papa, medallón de ternera (140 g), doble queso Tybo, cebolla caramelizada con champiñones, repollo encurtido y mayo de berenjena asada." }),
        product("burger-americana", "Americana", 16000, { description: "Pan de papa, doble medallón de ternera (140 g), salsa Tasty Hö, doble cheddar, pepinos encurtidos y bacon." }),
        product("burger-bufalo-picante", "Búfalo picante", 15000, { description: "Pan de papa, medallón de búfalo de 150 g, doble queso Tybo, lechuga repollada, aros de cebolla morada y mayonesa picante de pimientos ahumados." }),
        product("burger-vegana", "Vegana", 16000, { description: "Pan de papa, medallón de garbanzos, zapallo caramelizado, soja texturizada, dambo de almendras, tomates deshidratados, cebolla caramelizada y lechuga.", tags: ["Vegana"] }),
      ],
    }),
    category({
      id: "libre-de-gluten", name: "Libre de gluten", layout: "cards", tone: "verde", icon: "leaf",
      items: [
        product("empanadas-arabes", "Empanadas árabes", 12000, { description: "3 unidades.", tags: ["Sin gluten"] }),
      ],
    }),
    category({
      id: "sandwiches", name: "Sándwiches", layout: "cards", tone: "ambar", icon: "sandwich",
      note: "Todos incluyen acompañamiento de papas bastón.",
      items: [
        product("bondiolita", "Bondiolita", 18000, { description: "Pan artesanal, 180 g de bondiola braseada a la cerveza, doble Tybo, repollo blanco y mostaza a la miel." }),
        product("braseado", "Braseado", 18000, { description: "Pan artesanal, 180 g de ternera braseada a la cerveza, doble queso Tybo, salsa criolla y mayo de berenjenas asadas." }),
        product("calamar-pirata", "Calamar pirata", 18000, { description: "Aros de calamar frito entre pan de papa y alioli alimonado." }),
        product("wraps-pollo", "Wraps de pollo", 15000, { description: "Pollo desmechado, verduras salteadas, queso Tybo, lechuga y Ali Oli." }),
      ],
    }),
    category({
      id: "postres", name: "Postres", layout: "cards", tone: "rojo", icon: "dessert",
      items: [
        product("panqueque-ho", "Panqueque Hö", 7000, { description: "Panqueques de dulce de leche, helado y frutos rojos." }),
        product("tiramisu", "Tiramisú", 7000),
      ],
    }),
    category({
      id: "adicionales", name: "Adicionales", layout: "list", tone: "grafito", icon: "plus",
      items: [
        product("dips", "Dips", 500, { description: "Ketchup, mostaza, mayonesa, BBQ y Ali Oli." }),
        product("ensalada", "Ensalada", 7000, { description: "Combinado de verduras de estación." }),
      ],
    }),
  ],
};
