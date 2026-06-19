import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);
const session = driver.session();

const drugs = [
  { name: 'Warfarin',     category: 'Anticoagulant',   description: 'Blood thinner used to prevent clots' },
  { name: 'Aspirin',      category: 'NSAID',            description: 'Pain reliever and blood thinner' },
  { name: 'Ibuprofen',    category: 'NSAID',            description: 'Anti-inflammatory pain reliever' },
  { name: 'Metformin',    category: 'Antidiabetic',     description: 'First-line treatment for type 2 diabetes' },
  { name: 'Lisinopril',   category: 'ACE Inhibitor',    description: 'Treats high blood pressure and heart failure' },
  { name: 'Amoxicillin',  category: 'Antibiotic',       description: 'Penicillin antibiotic for bacterial infections' },
  { name: 'Fluoxetine',   category: 'SSRI',             description: 'Antidepressant (Prozac)' },
  { name: 'Sertraline',   category: 'SSRI',             description: 'Antidepressant (Zoloft)' },
  { name: 'Atorvastatin', category: 'Statin',           description: 'Lowers cholesterol (Lipitor)' },
  { name: 'Simvastatin',  category: 'Statin',           description: 'Lowers cholesterol (Zocor)' },
  { name: 'Digoxin',      category: 'Cardiac Glycoside',description: 'Treats heart failure and arrhythmia' },
  { name: 'Metoprolol',   category: 'Beta Blocker',     description: 'Treats high blood pressure and angina' },
  { name: 'Omeprazole',   category: 'PPI',              description: 'Reduces stomach acid (Prilosec)' },
  { name: 'Ciprofloxacin',category: 'Antibiotic',       description: 'Broad-spectrum antibiotic' },
  { name: 'Lithium',      category: 'Mood Stabilizer',  description: 'Treats bipolar disorder' },
];

const conditions = [
  { name: 'Type 2 Diabetes' },
  { name: 'Hypertension' },
  { name: 'Depression' },
  { name: 'Atrial Fibrillation' },
  { name: 'High Cholesterol' },
  { name: 'Bacterial Infection' },
  { name: 'Bipolar Disorder' },
  { name: 'Heart Failure' },
  { name: 'Chronic Pain' },
  { name: 'Fever' },
  { name: 'Inflammation' },
  { name: 'Acid Reflux' },
];

const treats = [
  { drug: 'Metformin',    condition: 'Type 2 Diabetes' },
  { drug: 'Lisinopril',   condition: 'Hypertension' },
  { drug: 'Lisinopril',   condition: 'Heart Failure' },
  { drug: 'Fluoxetine',   condition: 'Depression' },
  { drug: 'Sertraline',   condition: 'Depression' },
  { drug: 'Warfarin',     condition: 'Atrial Fibrillation' },
  { drug: 'Atorvastatin', condition: 'High Cholesterol' },
  { drug: 'Simvastatin',  condition: 'High Cholesterol' },
  { drug: 'Amoxicillin',  condition: 'Bacterial Infection' },
  { drug: 'Ciprofloxacin',condition: 'Bacterial Infection' },
  { drug: 'Lithium',      condition: 'Bipolar Disorder' },
  { drug: 'Digoxin',      condition: 'Heart Failure' },
  { drug: 'Digoxin',      condition: 'Atrial Fibrillation' },
  { drug: 'Metoprolol',   condition: 'Hypertension' },
  { drug: 'Aspirin',      condition: 'Chronic Pain' },
  { drug: 'Aspirin',      condition: 'Fever' },
  { drug: 'Ibuprofen',    condition: 'Chronic Pain' },
  { drug: 'Ibuprofen',    condition: 'Fever' },
  { drug: 'Ibuprofen',    condition: 'Inflammation' },
  { drug: 'Omeprazole',   condition: 'Acid Reflux' },
];

// severity: MAJOR, MODERATE, MINOR
const interactions = [
  { a: 'Warfarin',     b: 'Aspirin',       severity: 'MAJOR',    effect: 'Increased bleeding risk — combined anticoagulation effect' },
  { a: 'Warfarin',     b: 'Ibuprofen',     severity: 'MAJOR',    effect: 'Increased bleeding risk and reduced warfarin clearance' },
  { a: 'Warfarin',     b: 'Ciprofloxacin', severity: 'MAJOR',    effect: 'Ciprofloxacin inhibits warfarin metabolism, raising INR' },
  { a: 'Fluoxetine',   b: 'Sertraline',    severity: 'MAJOR',    effect: 'Serotonin syndrome risk — avoid combining SSRIs' },
  { a: 'Fluoxetine',   b: 'Lithium',       severity: 'MAJOR',    effect: 'Increased lithium toxicity and serotonin syndrome risk' },
  { a: 'Digoxin',      b: 'Amoxicillin',   severity: 'MODERATE', effect: 'Amoxicillin may increase digoxin absorption' },
  { a: 'Digoxin',      b: 'Metoprolol',    severity: 'MODERATE', effect: 'Additive bradycardia and AV block risk' },
  { a: 'Simvastatin',  b: 'Ciprofloxacin', severity: 'MODERATE', effect: 'Ciprofloxacin increases simvastatin levels, raising myopathy risk' },
  { a: 'Lisinopril',   b: 'Metformin',     severity: 'MINOR',    effect: 'May cause slight hypoglycemia enhancement' },
  { a: 'Omeprazole',   b: 'Metformin',     severity: 'MINOR',    effect: 'Omeprazole may slightly increase metformin plasma levels' },
  { a: 'Aspirin',      b: 'Ibuprofen',     severity: 'MODERATE', effect: 'Ibuprofen may reduce aspirin\'s antiplatelet effect' },
  { a: 'Atorvastatin', b: 'Digoxin',       severity: 'MINOR',    effect: 'Atorvastatin may slightly increase digoxin concentration' },
  { a: 'Lisinopril',   b: 'Aspirin',       severity: 'MODERATE', effect: 'NSAIDs can reduce the antihypertensive effect of ACE inhibitors' },
  { a: 'Metoprolol',   b: 'Fluoxetine',    severity: 'MODERATE', effect: 'Fluoxetine inhibits metoprolol metabolism, increasing bradycardia risk' },
  { a: 'Lithium',      b: 'Ibuprofen',     severity: 'MAJOR',    effect: 'NSAIDs reduce lithium clearance, risking toxicity' },
];

try {
  await session.run('MATCH (n) DETACH DELETE n');

  for (const d of drugs) {
    await session.run(
      'CREATE (:Drug {name: $name, category: $category, description: $description})',
      d
    );
  }

  for (const c of conditions) {
    await session.run('CREATE (:Condition {name: $name})', c);
  }

  for (const t of treats) {
    await session.run(
      `MATCH (d:Drug {name: $drug}), (c:Condition {name: $condition})
       MERGE (d)-[:TREATS]->(c)`,
      t
    );
  }

  for (const i of interactions) {
    await session.run(
      `MATCH (a:Drug {name: $a}), (b:Drug {name: $b})
       MERGE (a)-[:INTERACTS_WITH {severity: $severity, effect: $effect}]->(b)
       MERGE (b)-[:INTERACTS_WITH {severity: $severity, effect: $effect}]->(a)`,
      i
    );
  }

  console.log('✅ Drug interaction database seeded successfully!');
} catch (err) {
  console.error('❌ Seed error:', err.message);
} finally {
  await session.close();
  await driver.close();
}
