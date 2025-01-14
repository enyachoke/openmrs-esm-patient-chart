import useSWR from 'swr';
import { map } from 'rxjs/operators';
import capitalize from 'lodash-es/capitalize';
import { fhirBaseUrl, openmrsFetch, openmrsObservableFetch } from '@openmrs/esm-framework';
import { AllergyData, AllergicReaction, FHIRAllergy, FHIRAllergyResponse } from '../types';
import { ALLERGY_REACTION_CONCEPT } from '../constants';

export function useAllergies(patientUuid: string) {
  const { data, error, isValidating } = useSWR<{ data: FHIRAllergyResponse }, Error>(
    `${fhirBaseUrl}/AllergyIntolerance?patient=${patientUuid}`,
    openmrsFetch,
  );

  const formattedAllergies =
    data?.data?.total > 0
      ? data?.data.entry
          .map((entry) => entry.resource ?? [])
          .map(mapAllergyProperties)
          .sort((a, b) => (b.lastUpdated > a.lastUpdated ? 1 : -1))
      : null;

  return {
    data: data ? formattedAllergies : null,
    isError: error,
    isLoading: !data && !error,
    isValidating,
  };
}

function mapAllergyProperties(allergy: FHIRAllergy): Allergy {
  const manifestations = allergy?.reaction[0]?.manifestation?.map((coding) => coding.coding[0]?.display);
  const formattedAllergy: Allergy = {
    id: allergy?.id,
    clinicalStatus: allergy?.clinicalStatus?.coding[0]?.display,
    criticality: allergy?.criticality,
    display: allergy?.code?.coding[0]?.display,
    recordedDate: allergy?.recordedDate,
    recordedBy: allergy?.recorder?.display,
    recorderType: allergy?.recorder?.type,
    note: allergy?.note?.[0]?.text,
    reactionToSubstance: allergy?.reaction[0]?.substance?.coding[1]?.display,
    reactionManifestations: manifestations,
    reactionSeverity: capitalize(allergy?.reaction[0]?.severity),
    lastUpdated: allergy?.meta?.lastUpdated,
  };
  return formattedAllergy;
}

export function fetchAllergyByUuid(allergyUuid: string) {
  return openmrsObservableFetch(`${fhirBaseUrl}/AllergyIntolerance/${allergyUuid}`).pipe(
    map(({ data }) => data),
    map((data: FHIRAllergy) => mapAllergyProperties(data)),
  );
}

export function getPatientAllergyByPatientUuid(
  patientUuid: string,
  allergyUuid: any,
  abortController: AbortController,
) {
  return openmrsFetch<AllergyData>(`/ws/rest/v1/patient/${patientUuid}/allergy/${allergyUuid.allergyUuid}?v=full`, {
    signal: abortController.signal,
  });
}

export function getAllergyAllergenByConceptUuid(allergyUuid: string) {
  return openmrsObservableFetch(`/ws/rest/v1/concept/${allergyUuid}?v=full`).pipe(
    map(({ data }) => data['setMembers']),
  );
}

export function getAllergicReactions() {
  return openmrsObservableFetch<Array<AllergicReaction>>(`/ws/rest/v1/concept/${ALLERGY_REACTION_CONCEPT}?v=full`).pipe(
    map(({ data }) => data['setMembers']),
  );
}

export function savePatientAllergy(patientAllergy: any, patientUuid: string, abortController: AbortController) {
  const reactions = patientAllergy.reactionUuids.map((reaction: any) => {
    return {
      reaction: {
        uuid: reaction.uuid,
      },
    };
  });

  return openmrsFetch(`/ws/rest/v1/patient/${patientUuid}/allergy`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: {
      allergen: {
        allergenType: patientAllergy?.allergenType,
        codedAllergen: {
          uuid: patientAllergy?.codedAllergenUuid,
        },
      },
      severity: {
        uuid: patientAllergy?.severityUuid,
      },
      comment: patientAllergy?.comment,
      reactions: reactions,
    },
    signal: abortController.signal,
  });
}

export function updatePatientAllergy(
  patientAllergy: any,
  patientUuid: string,
  allergyUuid: any,
  abortController: AbortController,
) {
  const reactions = patientAllergy.reactionUuids.map((reaction: any) => {
    return {
      reaction: {
        uuid: reaction.uuid,
      },
    };
  });

  return openmrsFetch(`/ws/rest/v1/patient/${patientUuid}/allergy/${allergyUuid.allergyUuid}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: {
      allergen: {
        allergenType: patientAllergy.allergenType,
        codedAllergen: {
          uuid: patientAllergy.codedAllergenUuid,
        },
      },
      severity: {
        uuid: patientAllergy.severityUuid,
      },
      comment: patientAllergy.comment,
      reactions: reactions,
    },
    signal: abortController.signal,
  });
}

export function deletePatientAllergy(patientUuid: string, allergyUuid: any, abortController: AbortController) {
  return openmrsFetch(`/ws/rest/v1/patient/${patientUuid}/allergy/${allergyUuid.allergyUuid}`, {
    method: 'DELETE',
    signal: abortController.signal,
  });
}

export type Allergy = {
  id: string;
  clinicalStatus: string;
  criticality: string;
  display: string;
  recordedDate: string;
  recordedBy: string;
  recorderType: string;
  note: string;
  reactionToSubstance: string;
  reactionManifestations: Array<string>;
  reactionSeverity: string;
  lastUpdated: string;
};
