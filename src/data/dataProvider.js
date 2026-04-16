import { env } from '../config/env.js';
import * as localDataProvider from './localDataProvider.js';
import * as mongoDataProvider from './mongoDataProvider.js';

export const dataProvider = env.dataProvider === 'mongo' ? mongoDataProvider : localDataProvider;
