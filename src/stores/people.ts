import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Person } from '@/types';
import { TimeService } from '@/services/TimeService';
import { defaultPeople } from '@/data/defaultPeople';

export const usePeopleStore = defineStore('people', () => {
  // Initialize with example data
  const people = ref<Person[]>(defaultPeople);
  const timeService = new TimeService();

  function addPerson(name: string, timezone: string, date: Date, locale: string): void {
    if (!name || !timezone) return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
      timezone,
      currentTime: timeService.formatTime(date, timezone, locale),
      currentDate: timeService.formatDate(date, timezone, locale),
    };

    people.value.push(newPerson);
  }

  function deletePerson(id: string): void {
    people.value = people.value.filter(person => person.id !== id);
  }

  function updateTimes(date: Date, locale: string): void {
    people.value = people.value.map(person => ({
      ...person,
      currentTime: timeService.formatTime(date, person.timezone, locale),
      currentDate: timeService.formatDate(date, person.timezone, locale),
    }));
  }

  return {
    people,
    addPerson,
    deletePerson,
    updateTimes,
  };
});