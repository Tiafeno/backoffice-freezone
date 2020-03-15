
export const MSG = {
    ACCESS: {
        DENIED_TTL: "Access refusé",
        DENIED_CTT: "Vous n'avez pas l'autorisation"
    },
};

export const TinyConfig: any = {
    language_url: '/assets/js/langs/fr_FR.js',
    menubar: false,
    content_css: [
        'https://fonts.googleapis.com/css?family=Montserrat:300,300i,400,400i',
        'https://www.tiny.cloud/css/codepen.min.css'
    ],
    content_style: ".mce-content-body p { margin: 5px 0; }",
    inline: false,
    statusbar: true,
    resize: true,
    browser_spellcheck: true,
    min_height: 320,
    height: 320,
    toolbar: 'undo redo | bold backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat ',
    plugins: ['lists'],
};

export const FAI: Array<any> = [
    { name: 'Telma', _id: 0 },
    { name: 'Orange', _id: 1 },
    { name: 'Airtel', _id: 2 },
    { name: 'Bip', _id: 3 }
];

export const CONDITION = [
    { key: 0, value: 'Disponible' },
    { key: 1, value: 'Rupture' },
    { key: 2, value: 'Obsolete' },
    { key: 3, value: 'Commande' }
];

export const DEFINE_FREEZONE = {
    COST_TRANSPORT: 12600,
    MIN_TRANSPORT_WITH_COST: 100000
}