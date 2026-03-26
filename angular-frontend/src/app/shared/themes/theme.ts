import { signal } from '@angular/core';

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const MyCustomPreset = definePreset(Aura, {
	primitive: {
		// 1. 以 #3BB2BF 擴展出的主色系 (Primary)
		brand: {
			50: '#f2f9fa',
			100: '#e5f3f5',
			200: '#cce7eb',
			300: '#99cfd7',
			400: '#66b7c3',
			500: '#3BB2BF', // <--- 你的 Primary
			600: '#3298a4',
			700: '#2a7e89',
			800: '#22656e',
			900: '#1c535a',
			950: '#13383d'
		},
		// 2. 以 #606063 與 #D8D4D1 擴展出的表面/中性色系 (Surface)
		neutral: {
			0: '#FFFFFF', // 你的 pureWhite
			50: '#f9f9f8',
			100: '#f2f1f0',
			200: '#D8D4D1', // 你的 lightGray
			300: '#b4b0ad',
			400: '#8e8a87',
			500: '#71717a',
			600: '#606063', // 你的 darkGray
			700: '#3f3f46',
			800: '#27272a',
			900: '#18181b',
			950: '#09090b'
		},
		// 3. 你的珊瑚色 (Coral)
		accent: {
			50: '#fbf6f4',
			500: '#D9A491', // 你的 coral
			600: '#c28d7a',
			700: '#a3715f'
		}
	},

	semantic: {
		// 將元件的主色對應到上面的 brand 色卡
		primary: {
			50: '{brand.50}',
			100: '{brand.100}',
			200: '{brand.200}',
			300: '{brand.300}',
			400: '{brand.400}',
			500: '{brand.500}',
			600: '{brand.600}',
			700: '{brand.700}',
			800: '{brand.800}',
			900: '{brand.900}',
			950: '{brand.950}'
		},

		// 設定淺色模式下的介面顏色
		colorScheme: {
			light: {
				surface: {
					0: '{neutral.0}',
					50: '{neutral.50}',
					100: '{neutral.100}',
					200: '{neutral.200}',
					300: '{neutral.300}',
					400: '{neutral.400}',
					500: '{neutral.500}',
					600: '{neutral.600}',
					700: '{neutral.700}',
					800: '{neutral.800}',
					900: '{neutral.900}',
					950: '{neutral.950}'
				},
				// 將珊瑚色應用在警告或特殊強調上
				formField: {
					focusBorderColor: '{brand.500}'
				}
			}
		},

		// 額外細節：修改焦點外框顏色
		focusRing: {
			color: '{brand.500}',
			shadow: '0 0 0 0.2rem {brand.100}'
		}
	}
});

export const THEME = {
	primary: '#3BB2BF',
	darkGray: '#606063',
	coral: '#D9A491',
	lightGray: '#D8D4D1',
	pureWhite: '#FFFFFF'
};