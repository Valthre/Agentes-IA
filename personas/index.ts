/**
 * @file Agregador Principal de Agentes
 * @description Este arquivo importa todos os agentes de seus respectivos módulos
 * e os monta na lista `initialPersonas`, servindo como o ponto central
 * para a coleção de agentes disponíveis no aplicativo.
 */

import { Persona } from '../types';
import { defaultPersona, creativeWriterPersona } from './defaults';
import {
    webAgentPersona,
    hollywoodWriterPersona,
    marketingGuruPersona,
    careerCoachPersona,
    historianPersona,
    chefPersona,
    translatorPersona,
    financialAdvisorPersona,
    travelAgentPersona,
    philosopherPersona,
    interiorDesignerPersona
} from './specialists';
import {
    codeMentorPersona,
    languageTeacherPersona,
    financeGuidePersona,
    writingTutorPersona,
    wiseInvestorPersona
} from './mentors';
import { legalInformantPersona } from './specialists/legalInformant';
import { itInformantPersona } from './specialists/itInformant';
import { professionalAgentPersona } from './specialists/professionalAgent';
import { productArchitectPersona } from './specialists/productArchitect';
import { analyticalGeneralistPersona } from './specialists/analyticalGeneralist';
import { devSeniorPersona } from './specialists/devSenior';
import { personalTrainerPersona } from './specialists/personalTrainer';
import { legalMemorandumPersona } from './specialists/legalMemorandum';


const MENTOR_AGENTS: Persona[] = [
    codeMentorPersona,
    languageTeacherPersona,
    financeGuidePersona,
    writingTutorPersona,
    wiseInvestorPersona,
];

const SPECIALIZED_AGENTS: Persona[] = [
    // Advanced Agents from individual files
    itInformantPersona,
    legalInformantPersona,
    legalMemorandumPersona,
    professionalAgentPersona,
    productArchitectPersona,
    analyticalGeneralistPersona,
    devSeniorPersona,
    personalTrainerPersona,
    // Standard Specialists
    webAgentPersona,
    hollywoodWriterPersona,
    marketingGuruPersona,
    careerCoachPersona,
    historianPersona,
    chefPersona,
    translatorPersona,
    financialAdvisorPersona,
    travelAgentPersona,
    philosopherPersona,
    interiorDesignerPersona,
];

const DEFAULT_PERSONAS: Persona[] = [
    defaultPersona,
    creativeWriterPersona
];

export const initialPersonas: Persona[] = [
    ...DEFAULT_PERSONAS,
    ...SPECIALIZED_AGENTS,
    ...MENTOR_AGENTS
];