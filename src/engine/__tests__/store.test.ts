import { beforeEach, describe, expect, it } from 'vitest'

import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import { useSimulation } from '@/engine/store'

const estado = () => useSimulation.getState()

describe('store da simulação', () => {
  beforeEach(() => {
    estado().reset()
  })

  it('começa na SPE-1, bloqueado no primeiro checkpoint', () => {
    const s = estado()
    expect(s.spe).toBe('SPE-1')
    expect(s.playbookVersion).toBe(PLAYBOOK_VERSION)
    expect(s.run.records).toHaveLength(nasajonSuppliers.filter((x) => x.spe === 'SPE-1').length)
    expect(s.run.blockedAt).toBe('transform')
  })

  it('na SPE-1 isolada não há cluster: todos os pares de duplicata cruzam SPEs', () => {
    estado().approveMappingSme('approved')
    estado().approveMapping('approved')
    // o checkpoint 2 fica vazio e é satisfeito por vacuidade — não há o que confirmar
    expect(estado().run.clusters).toHaveLength(0)
    expect(estado().run.checkpoints.find((c) => c.id === 'duplicatas')?.requeridas).toBe(0)
    expect(estado().run.blockedAt).toBe('package')
  })

  it('deriva o run das assinaturas, avançando checkpoint a checkpoint', () => {
    estado().setSpe('todas')
    estado().approveMappingSme('approved')
    estado().approveMapping('approved')
    expect(estado().run.blockedAt).toBe('enrich')

    estado().confirmAllClusters('approved')
    expect(estado().run.blockedAt).toBe('package')

    estado().decideAllExceptions('approved')
    expect(estado().run.blockedAt).toBeNull()
    expect(estado().run.loadPackage).not.toBeNull()

    // o checkpoint 4 ainda precisa das duas assinaturas do data owner
    expect(estado().run.checkpoints.find((c) => c.id === 'pacote-reconciliacao')?.liberado).toBe(false)
    estado().approvePackage('approved')
    estado().approveReconciliation('approved')
    expect(estado().run.checkpoints.find((c) => c.id === 'pacote-reconciliacao')?.liberado).toBe(true)
  })

  it('assina com instante determinístico, não com o relógio da máquina', () => {
    estado().approveMapping('approved')
    const a = estado().approvals.mapeamento?.at
    estado().reset()
    estado().approveMapping('approved')
    expect(estado().approvals.mapeamento?.at).toBe(a)
  })

  it('zera as assinaturas ao trocar de SPE: assinatura não atravessa recorte', () => {
    estado().approveMappingSme('approved')
    estado().approveMapping('approved')
    expect(estado().approvals.mapeamento).not.toBeNull()
    estado().setSpe('SPE-2')
    expect(estado().approvals.mapeamento).toBeNull()
    expect(estado().run.blockedAt).toBe('transform')
    expect(estado().run.records).toHaveLength(nasajonSuppliers.filter((x) => x.spe === 'SPE-2').length)
  })

  it('reset volta ao estado inicial', () => {
    estado().setSpe('todas')
    estado().approveMappingSme('approved')
    estado().approveMapping('approved')
    estado().confirmAllClusters('approved')
    expect(estado().spe).toBe('todas')
    expect(estado().approvals.mapeamento).not.toBeNull()

    estado().reset()
    const s = estado()
    expect(s.spe).toBe('SPE-1')
    expect(s.approvals.mapeamento).toBeNull()
    expect(Object.keys(s.approvals.clusters)).toHaveLength(0)
    expect(Object.keys(s.approvals.excecoes)).toHaveLength(0)
    expect(s.run.blockedAt).toBe('transform')
  })

  it('recusar exceção mantém o registro retido e fora do pacote', () => {
    estado().setSpe('todas')
    estado().approveMappingSme('approved')
    estado().approveMapping('approved')
    estado().confirmAllClusters('approved')
    estado().decideAllExceptions('rejected')
    const run = estado().run
    expect(run.reconciliation?.held).toBeGreaterThan(0)
    for (const codigo of run.loadPackage?.registros ?? []) {
      expect(run.records.find((r) => r.codigo === codigo)?.outcome).not.toBe('held')
    }
  })
})
