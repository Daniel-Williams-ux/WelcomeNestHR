import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore'

export async function migrateOnboardingProgress(companyId: string) {

  const employeesSnap = await getDocs(
    collection(db, 'companies', companyId, 'employees')
  )

  for (const emp of employeesSnap.docs) {

    const employeeId = emp.id

    const flowsSnap = await getDocs(
      collection(
        db,
        'companies',
        companyId,
        'employees',
        employeeId,
        'onboardingFlows'
      )
    )

    for (const flowDoc of flowsSnap.docs) {

      const flowId = flowDoc.id
      const flowData = flowDoc.data() as any

      const progressSnap = await getDocs(
        collection(
          db,
          'companies',
          companyId,
          'employees',
          employeeId,
          'onboardingFlows',
          flowId,
          'progress'
        )
      )

      const completedTaskIds = progressSnap.docs
        .filter(d => d.data().completed === true)
        .map(d => d.id)

      const milestones = flowData.milestones ?? []

      for (const milestone of milestones) {
        for (const task of milestone.tasks ?? []) {
          if (completedTaskIds.includes(task.id)) {
            task.completed = true
          }
        }
      }

      await updateDoc(
        doc(
          db,
          'companies',
          companyId,
          'employees',
          employeeId,
          'onboardingFlows',
          flowId
        ),
        { milestones }
      )

      console.log(`Migrated employee ${employeeId}`)
    }
  }

  console.log('Migration complete')
}