export const createStorage = (key: string)=>{
  return {
    save: (value: any)=>{
      localStorage.setItem(key, JSON.stringify(value));
    },
    load: ()=>{
      return JSON.parse(localStorage.getItem(key) || '{}');
    }
  }
}