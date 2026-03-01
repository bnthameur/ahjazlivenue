export const WILAYAS = [
    { id: 'Adrar', code: '01', key: 'wilayas.Adrar' },
    { id: 'Chlef', code: '02', key: 'wilayas.Chlef' },
    { id: 'Laghouat', code: '03', key: 'wilayas.Laghouat' },
    { id: 'Oum El Bouaghi', code: '04', key: 'wilayas.Oum_El_Bouaghi' },
    { id: 'Batna', code: '05', key: 'wilayas.Batna' },
    { id: 'Bejaia', code: '06', key: 'wilayas.Bejaia' },
    { id: 'Biskra', code: '07', key: 'wilayas.Biskra' },
    { id: 'Bechar', code: '08', key: 'wilayas.Bechar' },
    { id: 'Blida', code: '09', key: 'wilayas.Blida' },
    { id: 'Bouira', code: '10', key: 'wilayas.Bouira' },
    { id: 'Tamanrasset', code: '11', key: 'wilayas.Tamanrasset' },
    { id: 'Tebessa', code: '12', key: 'wilayas.Tebessa' },
    { id: 'Tlemcen', code: '13', key: 'wilayas.Tlemcen' },
    { id: 'Tiaret', code: '14', key: 'wilayas.Tiaret' },
    { id: 'Tizi Ouzou', code: '15', key: 'wilayas.Tizi_Ouzou' },
    { id: 'Algiers', code: '16', key: 'wilayas.Algiers' },
    { id: 'Djelfa', code: '17', key: 'wilayas.Djelfa' },
    { id: 'Jijel', code: '18', key: 'wilayas.Jijel' },
    { id: 'Setif', code: '19', key: 'wilayas.Setif' },
    { id: 'Saida', code: '20', key: 'wilayas.Saida' },
    { id: 'Skikda', code: '21', key: 'wilayas.Skikda' },
    { id: 'Sidi Bel Abbes', code: '22', key: 'wilayas.Sidi_Bel_Abbes' },
    { id: 'Annaba', code: '23', key: 'wilayas.Annaba' },
    { id: 'Guelma', code: '24', key: 'wilayas.Guelma' },
    { id: 'Constantine', code: '25', key: 'wilayas.Constantine' },
    { id: 'Medea', code: '26', key: 'wilayas.Medea' },
    { id: 'Mostaganem', code: '27', key: 'wilayas.Mostaganem' },
    { id: "M'Sila", code: '28', key: 'wilayas.Msila' },
    { id: 'Mascara', code: '29', key: 'wilayas.Mascara' },
    { id: 'Ouargla', code: '30', key: 'wilayas.Ouargla' },
    { id: 'Oran', code: '31', key: 'wilayas.Oran' },
    { id: 'El Bayadh', code: '32', key: 'wilayas.El_Bayadh' },
    { id: 'Illizi', code: '33', key: 'wilayas.Illizi' },
    { id: 'Bordj Bou Arreridj', code: '34', key: 'wilayas.Bordj_Bou_Arreridj' },
    { id: 'Boumerdes', code: '35', key: 'wilayas.Boumerdes' },
    { id: 'El Tarf', code: '36', key: 'wilayas.El_Tarf' },
    { id: 'Tindouf', code: '37', key: 'wilayas.Tindouf' },
    { id: 'Tissemsilt', code: '38', key: 'wilayas.Tissemsilt' },
    { id: 'El Oued', code: '39', key: 'wilayas.El_Oued' },
    { id: 'Khenchela', code: '40', key: 'wilayas.Khenchela' },
    { id: 'Souk Ahras', code: '41', key: 'wilayas.Souk_Ahras' },
    { id: 'Tipaza', code: '42', key: 'wilayas.Tipaza' },
    { id: 'Mila', code: '43', key: 'wilayas.Mila' },
    { id: 'Ain Defla', code: '44', key: 'wilayas.Ain_Defla' },
    { id: 'Naama', code: '45', key: 'wilayas.Naama' },
    { id: 'Ain Temouchent', code: '46', key: 'wilayas.Ain_Temouchent' },
    { id: 'Ghardaia', code: '47', key: 'wilayas.Ghardaia' },
    { id: 'Relizane', code: '48', key: 'wilayas.Relizane' },
    { id: "El M'Ghair", code: '49', key: 'wilayas.El_MGhair' },
    { id: 'El Meniaa', code: '50', key: 'wilayas.El_Meniaa' },
    { id: 'Ouled Djellal', code: '51', key: 'wilayas.Ouled_Djellal' },
    { id: 'Bordj Baji Mokhtar', code: '52', key: 'wilayas.Bordj_Baji_Mokhtar' },
    { id: 'Beni Abbes', code: '53', key: 'wilayas.Beni_Abbes' },
    { id: 'Timimoun', code: '54', key: 'wilayas.Timimoun' },
    { id: 'Touggourt', code: '55', key: 'wilayas.Touggourt' },
    { id: 'Djanet', code: '56', key: 'wilayas.Djanet' },
    { id: 'In Salah', code: '57', key: 'wilayas.In_Salah' },
    { id: 'In Guezzam', code: '58', key: 'wilayas.In_Guezzam' }
] as const;

export type Wilaya = typeof WILAYAS[number];

export const getWilayas = (t: (key: string) => string) =>
    WILAYAS.map((wilaya) => ({
        id: wilaya.id,
        code: wilaya.code,
        name: t(wilaya.key)
    }));

export const getWilayaLabel = (t: (key: string) => string, id?: string | null) => {
    if (!id) return '';
    const wilaya = WILAYAS.find((item) => item.id === id || item.code === id);
    return wilaya ? t(wilaya.key) : id;
};
