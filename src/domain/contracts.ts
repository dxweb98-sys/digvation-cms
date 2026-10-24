import type {WebsiteContract} from './types.ts'
import contractFixtures from '../data/contracts.json' with {type: 'json'}

export const contracts = contractFixtures as WebsiteContract[]

export const demoUsers = [
  {id: 'operator', name: 'Dicky', email: 'admin@digvation.test', role: 'operator' as const, websiteIds: ['poseidon', 'arunika'], initials: 'DK'},
  {id: 'poseidon-owner', name: 'Nadia Pratama', email: 'owner@poseidon.test', role: 'client' as const, websiteIds: ['poseidon'], initials: 'NP'},
  {id: 'arunika-owner', name: 'Raka Aditya', email: 'owner@arunika.test', role: 'client' as const, websiteIds: ['arunika'], initials: 'RA'},
]
