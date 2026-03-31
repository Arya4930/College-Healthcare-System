import antacidLogo from '/assets/medicines/antacid.jpg';
import aspirinLogo from '/assets/medicines/aspirin.jpg';
import ibuprofenLogo from '/assets/medicines/ibuprofen.jpg';
import ParacetamolLogo from '/assets/medicines/paracetamol.jpg';
import CoughSyrupLogo from '/assets/medicines/cough-syrup.jpg';
import AntihistamineLogo from '/assets/medicines/antihistamine.jpg';
import VitaminCLogo from '/assets/medicines/vitamin-c.jpg';
import MultivitaminLogo from '/assets/medicines/multivitamin.jpg';

export const medicinesData = [
    {
        id: 1,
        name: "Aspirin",
        price: 200,
        description: "Pain reliever and fever reducer",
        image: aspirinLogo,
        stock: 100
    },
    {
        id: 2,
        name: "Ibuprofen",
        price: 300,
        description: "Anti-inflammatory pain reliever",
        image: ibuprofenLogo,
        stock: 80
    },
    {
        id: 3,
        name: "Paracetamol",
        price: 250,
        description: "Pain and fever reliever",
        image: ParacetamolLogo,
        stock: 120
    },
    {
        id: 4,
        name: "Cough Syrup",
        price: 300,
        description: "Effective cough suppressant",
        image: CoughSyrupLogo,
        stock: 60
    },
    {
        id: 5,
        name: "Antihistamine",
        price: 300,
        description: "Allergy relief medication",
        image: AntihistamineLogo,
        stock: 90
    },
    {
        id: 6,
        name: "Vitamin C",
        price: 200,
        description: "Immune system booster",
        image: VitaminCLogo,
        stock: 150
    },
    {
        id: 7,
        name: "Antacid",
        price: 200,
        description: "Heartburn and indigestion relief",
        image: antacidLogo,
        stock: 75
    },
    {
        id: 8,
        name: "Multivitamin",
        price: 200,
        description: "Complete daily nutrition",
        image: MultivitaminLogo,
        stock: 110
    }
];