'use client'

import {
  useEffect,
  useState,
} from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import province from '@/lib/data/province.json';

interface LocationOption {
	code: string;
	name: string;
}


interface LocationSelectorProps {
	value: string;
	className?: string;
	layout?: 'grid' | 'column';
	disabled?: boolean;
	onChange: (location: string) => void;
	title?: string;
}

export function LocationSelector({
	value,
	className = '',
	layout = 'grid',
	onChange,
	disabled = false,
	title = 'Địa chỉ'
}: LocationSelectorProps) {
	// Cache districts and wards arrays
	const [wards, setWards] = useState<LocationOption[]>([])
	const [newAddress, setNewAddress] = useState(() => {
		const [address, ward, city] = value.split(',')
		return {
			address: address ? address.trim() : "",
			city: city ? city.trim() : "",
			ward: ward ? ward.trim() : ""
		}
	})
	// Load districts when city changes
	useEffect(() => {
		if (newAddress.city) {
			const selectedProvince = province.find((prov) => prov.name.toString() == newAddress.city)
			setWards(selectedProvince ? selectedProvince.wards.map(ward => ({
				code: ward.ward_code.toString(),
				name: ward.name
			})) : [])
		}

	}, [newAddress.city])

	// Load wards when city changes
	useEffect(() => {
		if (newAddress.city) {
			const selectedProvince = province.find((prov) => prov.name.toString() == newAddress.city)
			const newWards = selectedProvince ? selectedProvince.wards.map(ward => ({
				code: ward.ward_code.toString(),
				name: ward.name
			})) : []
			setWards(newWards)
		} else {
			setWards([])
		}
	}, [newAddress.city])

	// Handle city change
	const handleCityChange = (name: string) => {
		setNewAddress({
			...newAddress,
			city: name,
			ward: ''
		})
	}


	// Handle ward change
	const handleWardChange = (name: string) => {
		setNewAddress({
			...newAddress,
			ward: name
		})
		const address = `${newAddress.address}, ${name}, ${newAddress.city}`
		onChange(address)
	}

	const containerClass = layout === 'grid'
		? 'grid grid-cols-3 gap-2'
		: 'flex flex-col gap-2'

	return (
		<div className={`${containerClass} ${className}`}>
			{/* City Select */}
			<div className='space-y-2'>
				<Label htmlFor="new-address">{title}</Label>
				<Input
					id="new-address"
					value={newAddress.address}
					onChange={(e) => {
						setNewAddress({ ...newAddress, address: e.target.value })
						onChange(`${e.target.value}, ${newAddress.ward}, ${newAddress.city}`)
					}}
					placeholder="Số nhà, tên đường..."
					className='border-wood-500'
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor="city">Tỉnh/TP *</Label>
				<Select
					value={newAddress.city}
					onValueChange={(value) => handleCityChange(value)}
					disabled={disabled}
				>
					<SelectTrigger className='border-wood-500 w-full'>
						<SelectValue placeholder="Chọn Tỉnh/TP" />
					</SelectTrigger>
					<SelectContent>
						{province.map((province) => (
							<SelectItem key={province.code} value={province.name}>
								{province.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Ward Select */}
			<div className='space-y-2'>
				<Label htmlFor="ward">Xã</Label>
				<Select
					value={newAddress.ward}
					onValueChange={(value) => handleWardChange(value)}
					disabled={!newAddress.city || disabled}
				>
					<SelectTrigger className='border-wood-500 w-full'>
						<SelectValue placeholder="Chọn Phường/Xã" />
					</SelectTrigger>
					<SelectContent>
						{wards.map((ward) => (
							<SelectItem key={ward.code} value={ward.name}>
								{ward.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
} 