import { components } from './index'
import { components as componentsOld } from './crd-temp'

export type BookingCalculation = components['schemas']['CalculatedReleaseDates']
export type WorkingDay = components['schemas']['WorkingDay']
export type CalculationBreakdown = components['schemas']['CalculationBreakdown']
export type DateBreakdown = components['schemas']['DateBreakdown']
export type ValidationMessage = components['schemas']['ValidationMessage']
export type ReleaseDateCalculationBreakdown = components['schemas']['ReleaseDateCalculationBreakdown']
export type CalculationFragments = components['schemas']['CalculationFragments']
export type CalculationUserQuestions = components['schemas']['CalculationUserQuestions']
export type CalculationSentenceQuestion = components['schemas']['CalculationSentenceQuestion']
export type CalculationUserInputs = components['schemas']['CalculationUserInputs']
export type CalculationSentenceUserInput = components['schemas']['CalculationSentenceUserInput']
export type CalculationResults = components['schemas']['CalculationResults']
// TODO the below Sentence diagram objects to be removed as part of tech debt tickets, they have already been removed from the api side
export type SentenceDiagram = componentsOld['schemas']['SentenceDiagram']
export type SentenceDiagramRow = componentsOld['schemas']['SentenceDiagramRow']
