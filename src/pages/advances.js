/* ============================================================
 * ADVANCES.JS — CRUD Avances + Remboursements
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier advances.js fourni
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

/* ── Logo inline (base64) — évite les chemins relatifs cassés dans les popups ── */
const _LOGO_B64_ADV = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYyMCA2MjAiIHdpZHRoPSI2MjAiIGhlaWdodD0iNjIwIj4KCTxkZWZzPgoJCTxpbWFnZSB3aWR0aD0iMTc0IiBoZWlnaHQ9IjE5NSIgaWQ9ImltZzEiIGhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSzRBQUFERENBTUFBQUFzdU5wWUFBQUFBWE5TUjBJQjJja3Nmd0FBQW9WUVRGUkY4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXckFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjZXaG9uQUFBQU5kMFVrNVRqUC93NU5uT3Y1cHJQQXNBcU42alhCTEJ4Mzh6RHRja0hPWE5iQ2p4MzE0Q1B2blZVZjdGSjNINmlRcVA0MHNCcnBBRUJza1k2ajhiL1Z0aWNGVitrWFJmTW9mZ0NXN3RqU0NlK3hZc2lPSDNEZUlGYVpORVBhWVBzUkJ6YlVmek1STmxxYmIxQXhueWQ5MnZZZXNpZkZpaWdjYnBET2pJTjFabm5LcSsyMnI4WUUzWUlYdElKYWM0MDl4SkhybHZGTkN3T3VaUTFvT0s5aFVIMFIvdmxCbzVuK2VydElzcEZ5Nnl1SVJVN2thU3c4eEFlSG1id0N1cytCMkZMN3FYTkdSb3Bjc0lja1U3TmV5MVhabTNobE85Mm1iME1NcFFpWm9FQUFBSlFrbEVRVlI0bk5XZGVYQlBWeFRIN3kyVDJsSlVZeXpWQ1EzU1lxclNsRlJSaVNXTUVWdEVSNGl0cGFGcUo0UVFTMHRWWTB1dFFZWldRNHJhMjZHMVRvdGFxblJYU3F1cU16clZsaWxEZjBra3Y3ZS8rNzN2M1h2YjcxL3YzWGVPMzRmMys3Mzc3cm5uSEpSUUlrVzBSSjcrbFBMMEw3K0kyRlFoUUh5TDE1bVdKeUcvKzBuRHBNcVUzdUJ5RE9DV28xZDlwbUZScVlxbC84UzlBcmdrbFA3aVB3NkRxbFA0dmhiZ0J1N05KUUUwREtwRndUdGJpRXVxMGgrRTRMaXJEcjJNbUJmaEJ1N0xkMEpvR0ZRWHViWDNjRW10cjhYQU1DaVMwdk9zdHNXNHBQWVpNVEFzYWtpL1o3UXN3WTJncDBUUk1LZ3haYnU3SmJnazhwejg2U0tvS0hxV3hTeUlxMmk2S0ZZMC9ZTEJTb05MR2gyOUk0ekdYYzFZdm8xYVhIWFRSYUVpcXA1MHRkSGhLcHd1Q3RYOGhKdUZIcGMwT1NpTWhVVVAzblF4TU9DcW5DNEsxT0l6NSt0R1hQTFVmbUVzTEdwMTFQR3lDVmZ0ZEVGSURjZW52d21YcUZoZGFQWGNFWWVMRnJocXB3c1NXZjFUKzRzV3VJcW5DMUx0aHYzSzB3cFg4WFJCS2xXMHZiMld1S1NoMC9kSHZHSS9zYnRpamF0eWRSRlF4S1g3Yks3WTRDcWVMdUxvWWVzTGRyaUtwNHVXeDZ6SGJYSFZUaGQyWHdkYlhNWFRSYW43TFljZGNOVk9GMjBQV1kwNjRLcWRMdG9kLzl0aTFBbFg3WFRSL29ERm9DT3UwdFZGWkxqRnM4a1pWK2wwMFdHZmVjd0ZWK1YwMFpGK1pCcHp3L1dvV0VyZjUzWis3SUpwU0RCdVFBMnJoR3poODZRSkg1aUdoT01HbmtsSG1tN2ljalF2M0dUZ0VoSlBOL0U4d2l2VU1mN1E1ZUFTOGt5bGt4elBtTVR0aGdGWnVJUjB1b24vNkpLMkdnYms0WkxPOUIzVUpiTEpadjJBUkZ4Q3VxNURQWkxmMDU5THhTWGRhUzdtVVBjbi9ibGNYSko0RitUdGw2YzdsWXhMN3NUdWdPd2YrVTEzS2h1WEpLMkN6QWVzMTUxS3h5WFByMFNzQjFIZHoxTStiakpkaXBpWDBhMHg1ZU9TYUl2M1dIc04wZjAyRmVDU2xMY0E0OVRWMmpNVnVQMFhBOGJEY3JSbktuRHJYMGJTUFY3Vy9qUlY0SkpCQ3dEalY1WnJUcFRnaG9ZQ0w1TzZ6U3NsdUtUbXQreTJJNVpwVHRUZ0RuNlQzWGJVRXMySkd0eXE1OWx0UjJzZmUycHdVK2NDeG0wMG9XazF1R1RvNit5MjlUU0JPa1c0dythdzI0NWZHRHhXaEpzQUxOdjY1QWVQRmVHMjJzbHVPMEV6cWZ3UGNOUG1CNDhWNFk2WXhXN2JXeE94VW9RN2NpYTc3WDhBZDlRTWRsdnRwb29pM05IVDJXMm5hT1lVTmJpOWEweGpOKzcvYnZCWURXN3NOc0JZbXo2aUJuZmNWTUI0MnV6Z3NScmNqaHNCNHlxYUlnQTF1Qk9tQU1aTlR3ZVBsZUNtVFFhTUk4cHBWa3BLY0NlbUE4YlIyclJ0SmJodGtMQi8xSmVhRXhXNGt5WWgxaUdsTlNjcWNKR1hYZjJrcGdJM2ZTSmtybDFNcU1DZG5BYVphMWVXQ25DblRJRE1aK3ZlTHFUalJ2WWFCOWszL2taN0poMjNubnMrdkU0emRTL3lzbkdualFVZHl1bk9KT05tanIyTE9ieWhuNi9sNHFabTNRWTk1dW5uYTZtNDRaZXZnUjdOa3ZRem9FemM1TWRIb0M3ekRjOW9pYml2WFFUaWVQZlV5RkRJSmcrMzd4SjNHNk1XampjTXlNS2RRNGR5ZUdXUE1Rekl3RzFkTHZZNk5wWGQweEk2MGpDQzRDS0JMVitrbjRBTGhPQm0wUmY4aEhGVjdiWnJqVVBRbDJFQkhlZ2pqYXR5aHBtR3NPL3VvNmZkYmZ6VEt2T3ZFL3lwelUzMWk4VmRWclYySUc3WXo5eWRJRkJsYnJMSXhVVWZaRDF6WmVXanI3YTZrZkJ6dDJ6WVYzN0F1R3JOUzFhaitEUXhKdE03aTd0eWQyMjJHdWFZMVpiMjhRempxb3l5MXY4b0hMamhRM21tZjB5OWJmS1RlZDRaS3NTRG1ZR3cxcjVvYzRIckZXZDhoaGNXZDgzNU5kdm1DdDhiMmZMZUhtQmNGZDM1VmJ0TGZMajFXOC9qcDNGVHUzNkRiSzl4dnUrdVBJNHZaQmpWdCtNQSs0dThyK2ZaZVZoaUs3TVNZcHllNjl5ckNVSFZOVFRSY2N1TmYvR3pLb25YMDBHWk5ZWTdYdWZIVFMwTDdPc3lLaS9GcFZ1Wmg2WGxpcjBydUgydHRXRzZXL2FlbDVWd2JnOStYd3ZsMDJSWEcwOEw5M1ZkUFRnYnRYbUhhU0ZwbGlmYytsTVRQSGpybEhGdEMwdmRyTGV3U1BJSjU5NGF6S3FRenZZVzdUR0tzMzZXYmJFL29NR2RMalBHSnIwR25mSTZlZk1QcU5ua2JITlJwWTA4eDhpbWovYjRCK3lnM2RtTlBlTjJ1YkxIZzNkR1RBNlM1K0pEQkRLbmNudGUxNVZsd3JwZ0hqNEVUQi82a2M5ditibWpOazBqN09WSGZQZjJQN2hQV0hJWWtQbFdJajl3NHp1QWdkVEpMV2xudm8veUpYcU9CbEpIUWtWS1d2a1Q3Ri9iRGJQZjJKZnpnM3phbTBBcUN3ck11NE5QaEdMNXRaV3lOUTR5SDdlSTcyUDh3dTJ5SGd1azd1V2J2SDNicU5yZUdyUC91Q1BQcC9pM3I3YXpGV1NlY2RaWXY4NGlIN2NCZDdXRXpBZjE0bmoyK29pYmRRc0xwQzRNTWU1SnVzdlBUZGEwcFZoZm1nTzBIZm9SdnU0Sm80SFUvZkhvSi9pN2hSMW43S2Znb2tOdHdRL3dlY2NkS1RBbzBPRTJtTDNQdUQzRHNFRHF3Nm5ZMzgvdmZJWTlNWmg5cmJnOGQ2T2dmRSsvbURFS3M2K1VpTFRFOEQ5YkJOMTJhNEIwdWZJZk4vd3EySFV0QnVpQ0p5QVhCdzJrN3E0WXkyd3JJblVJRGFSR1A4a1FleXlTa0V3bnRPVjdWaHJyZi9FaEJCZmVkdHN6Z1BIN0xpYVBiR1dkcHBnRDYrTkJVTm9iSEVnZHl0YlFSVlNXSHByeDZOZ2tPQ2hoU1lYb3RsdTFLSllncnpCY2VOdXRlZ09HQUorNGxNMFZWY0JBNnBGRTk4ZUR3QXpUZmRHZ3d6SDN0YW5JaE5odDdKTnJrWXpkeDh3U2lSdWZBbTY3WmN5MmE4SmNMS0hweHFIWndDNUpnZktYdS9SVUZwc2R2WFljMko0dzh3KzdwS0VpQ1U3bWpyTHFTdXVrZ1VjZC80S2ljODhQUklFT0cxS2Nyb3JHeGJmZEhuQ3FzeEdlMlo4ekZjeEl6UWh4Nk4wZ3ZoQUJiSjVIOUZYaUJrbW9teWgxSFhSd2VOdVJnSXZYTDFSdXZjdm1pb3lxbElHTHdKbzZ5N2JSaFpKUzg0TnV1eGtiL2dVbHAwVHBZQlBRSVdKRGM4dHhTUlZWaHh1akhnc3N5NGtsNGVMMUM5WnZPN0xxMWNvMlJUTlNUOFZaTk8yWFZnM1lqVG13Vkt6MEsrWlFxcnppUmJ4K29ZZjVoc2pERGI5NURuWDV2Smx4UkdJbEsxNi9ZTjZJbFZrbmpOY3ZuQjV1aU8xSXJjSnVzUnYxaUU3U2Q5Q1Jpc3RSdjdCNGpDNzBLN2NrbjZOK1FWOVBJN25oQVVmOWdpNjJJN3VkQk5hSnVWQXpOT1hKMHB0MWNOUXZQSHU4NUZBNkxrZjl3dTZhVHhjZnltODBrMzloQ09xU1c2MDQ3VXhCR3grTytvWEZHZmZlemxUMGRJSjZ2UldwdUNPS0NsdzRrQnJRaDBVdVN2cVJoVDVoK2g5eFhMV29zTU9EbWw1NkhQVUxTN2J0SmNxNmJFS2R6NHVVKy9aK1piaGttWHM1a2xGeFBVY3F3KzF5NENMc2N5WmFHUzVKWElQNzdJOVhoa3NhdzFVSWhMVDZGKzVYem1tL3cyQkFBQUFBQUVsRlRrU3VRbUNDIi8+CgkJPGltYWdlIHdpZHRoPSIxNDUiIGhlaWdodD0iMjM4IiBpZD0iaW1nMiIgaHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFKRUFBQUR1Q0FNQUFBQU9jaFVGQUFBQUFYTlNSMElCMmNrc2Z3QUFBUHhRVEZSRkFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjllM3YwUUFBQUZSMFVrNVRBRFAvOXZYMDgvSHc3Kzd0NitycDZPZmw1T1BpNE4vZTNkemEyZGpYMWRUVDB0SFB6czNNeXNuSXg4YkV3OExCUVpEc0NndGcvaXJBdUNCSWdBSjRFN0NnRlBvNGNOQ0kreDB1QlZDWU1GZ0lRS2hvMEs5WER3QUFCOU5KUkVGVWVKeTFuTTl2bFVVVWh2dXhjNHRibzB2RHFqVldrVkpBSzlTRVVpdjZkNnJGWDBSRnNWVEZpb2F3VW5adTNMSFdqU1o2eisyOXZlYzdNOS9NYytiTXM2QzN0Wk04SklaMzhyNzNmc05hUDRaaDhSWFIwZWlWSi96TVJrK2p6ZC8vNG9mV0gzYzBldTFYZm1aek9PbG85TWJQL016RmgydjlqTGIrK1lVZnV2UkRSNlB0SC9tWjh4ZU8reGxkZWZxTUg5cCtzTmJQNlBKRGZ1YmM1YU9PUm04KzRHZXUzVi9yWjdRejNIY2N1cmZXeitqR04vek15Ny9OL3V4bHRIdVBuM24xMGV6UFRrYlh2K1ZuTmdiNVI3NlQwVnRIL015TkwrVkxINlBOSi8vaU03dkRYZm5heDhnVHNsZS9tMy90WStRSjJmOGpUZWhpZFBNWkQ5a1hYanFlditoaTVMazh2djMxNllzZVJudEgvUElva1NiME1McjFCVCt6OStuaVZROGpUOGplK21UeHFvT1JKMlRua1NaME1McjZQVCt6ZjJmNU10N0ljM25jZVBGdytUcmU2UGFkOHUrTU9ZMDBJZDdJRWJLTFNCUENqVHdoKzk1SEs5K0VHMzN3TVQ5enNIb20zTWh4ZVZ4R21oQnQ5TzVuL016dEQxZS9pelp5aE95NWRYV2JDamJ5aE94WnBBbkJSbzZRM1J4TzFQZkJScGRPeXI4ejR2V2Y5UGV4UnA2R1puLzBiM3lza2FPaE9iOTlxSDhRYXVRSjJlM3haU3JVeUJHeXUzK1BZekRVNlAzRDh1K01VSkVtUkJwNUxvODdKblFpalJ3TnpmV3Z6SThpalJ3aHF5Tk5DRFJ5aE94cFFhTUlOTnIvSEI5WmYyeC9GbWZrdUR5T0kwMklNM0kwTkJkVERYT2NrYU9odVpuNlB5L015Qkd5SnRLRU1DTkh5SnBJRTZLTTloN2hrRDByYUJSUlJvN0w0N1YwNWtRWk9Sb2FHMmxDa0pFalpGY0tHa1dRa1NOazU1dURKY2JveXA5LzBDT3BTQk5pakJ5WHg5V0NSaEZqeEJ1YXplZnZadjVMaUpFalpKT1JKb1FZT1VKMnNUbFlRb3g0eU9xQ1JoRmg1SmhCbHB1REpjS0lOelNaU0JNQ2pCd056YWlnVVFRWU9VTDJiSE93QkJqeGtNMUZtdEJ1dFBVY0R0bHhRYU5vTitLWHg5WE53ZEpzNUdob3NwRW1OQnZ4a0ZXYmc2WFppSWVzTFdnVXJVYU9rRDJZM2lsYWpmZ01NaEZwUXFzUmIyZ1NCWTJpMFlnM05LUE53ZEpveEVOMkt0S0VOaU1lc3NtQ1J0Rm1kRkQ2Q3h2R200T2x6WWhmSGljalRXZ3k0ZzFOdXFCUk5CbnhrTjBxdnp1aHhZaUhiQ0hTaEJZai9rYlZRcVFKTFViODhwZ3BhQlFOUnJ5aFNXd09sZ1lqM3RDVUlrMW9NTUlobXkxb0ZINGpIcktwemNIaU44SXpTRG5TQkxjUnZ6em1DeHFGMjRnM05Nbk53ZUkyd2lGYkVXbUMxNGlIYkhwenNIaU4zc2tYUUdtbUNocUYwNGhmSGpPYmc4VnB4QnVhbWtnVG5FWTRaQ2NMR29YUGlJZHNibk93K0l4d3lOWkZtdUF5NGpQSWRFR2pjQm5oaGlhL09WaGNScmlocVl3MHdXUEVRemEvT1ZnOFJqaGtaeC9kcThaamRPRXBQRkFiYVlMRENGOGVxeU5OY0JqaGhxWlkwQ2k0RVEvWnFjM0J3bzF3eU5aSG1zQ044QnRWeXdXTkFodmh5K1AwNW1EQlJyaWhBWkVtVUNQYzBOUVVOQXBxaEVOMjhkRzlhcWdSRGxrU2FRSTAyam1HSVZ2YUhDelFDRjhlcXdvYUJUU2lEVTF4YzdBd0l4eXlMTklFWmtSRHRyS2dVU0FqL0x5Tzh1WmdRVWI0OGdnalRVQkd0S0dwTFdnVXhBaUhiTVhtWUNGR05HUnhwQW5BQ0lkc3plWmdBVVo0QmluTTZCbUFFVzFvZUtRSjlVYTRvZUdSSnRRYjBaQUZCWTJpM29pR2JOM21ZS2syb3MvcjhFU2FVRzFFTDQra29GSFVHdUdHcG5KenNOUWEwWkIxUlpwUWEwUkRGaFUwaWtvaitrWlYrOUc5YWlxTjZPWFJGMmxDblJGdWFLbzNCMHVkRVcxb1lFR2pxRE9pSVZ1L09WaXFqR2pJZWlOTnFES2l6K3VnQlkyaXhvaGVIc25tWUtreG9nMk5POUtFR2lNYXNyaWdVVlFZMFpCRm00T2x3b2krVWRVZmFVS0ZFYnc4c3MzQlVqYWlEVTMxako2aGJFUkR0aUhTaEtJUkRkbVdTQk9LUmpSa1BRV05vbWdFWnhDNk9WaEtSclNoYVlvMG9XUUVHeHBmUWFNb0dOR1F4WnVEcFdCRVE3WXQwb1NDRVh4ZWg3T2dVVXdiMGN2anhFZjNxcGsyZ2cxTmE2UUowMFl3WkIyYmcyWFNDSWFzdTZCUlRCckJrUFZzRHBZcEl6cURORWVhTUdVRUd4cC9RYU9ZTW9JTmpXdHpzRXdZd1pBTmlEUmh3Z2lHYkVOQm84Z2IwZWQxK0RZSFM5NElYaDRqSWszSUc4R0d4cms1V0xKR01HU2JDaHBGMWdpR3JIZHpzT1NNNEJ0Vll5Sk55Qm5CeTJOYlFhUElHY0dHeHIwNVdESkdzS0VKaWpRaFl3UkR0ckdnVVdTTVdNZzJiQTZXdEJHY1FhSWlUVWdid2N0amEwR2pTQnJCaHFicW8zdlZKSTFneUlaRm1wQTBZaUViRjJsQ3lnZytyNk85b0ZHa2pOamxzVzF6c0NTTVlFTVRHR2xDd2dpR2JFQkJvMGdZc1pCdDNCd3MxZ2lHYkdTa0NkYUl6U0FoQlkzQ0dyR0dwblZ6c0JnajJOQ0VScHBnakZqSU5tOE9sckVSRE5tWWdrWXhObUxQNjJqZkhDeGpJM1o1REk0MFlXVEVHcHFvZ2tZeE1tSWhHN0E1V0xRUkRObm9TQk8wRVh1amFsaEJvOUJHN1BJWXNUbFlsQkZyYU9JalRWQkdyS0VKMlJ3c3lvaUZMUHZvWGpXclJpeGtPMFNhc0dyRW50ZlJJZEtFRlNOMmVZd3NhQlFyUnF5aENkb2NMQ3RHS0dTN1JKcHdac1JDTnJTZ1Vad1pzZWQxUkcwT2xxVVJ1enoyaVRSaGFjUWFtdGlDUnJFMFFpSHIrT2hlTlFzakZyS2RJazFZR0tHUURkd2NMS2RHYkFhSkxtZ1VwMGFzb1FuY0hDeW5ScWloNlJacHd0eUloV3g0UWFPWUc2R1FEZDBjTEhNajlMeU9mcEVtaUJHN1BNWVhOQW94UWcxTjdPWmdtUm14a08wWWFjTE1DSVZzOE9aZ21SbWhONnJHemVnWkJuaDU3QnBwd2dBYm1xNlJKZ3l3b2VsUzBDZ0dGckxobTRObFlDSGJOOUtFQVQydm8xTkJveGpRNVRGK2M3QU1xS0hwSEduQ2YwMm1IbkF2QmhQR0FBQUFBRWxGVGtTdVFtQ0MiLz4KCTwvZGVmcz4KCTxzdHlsZT4KCQkuczAgeyBmaWxsOiAjMDAwMDAwIH0gCgk8L3N0eWxlPgoJPHBhdGggaWQ9IkNhbHF1ZSAxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsYXNzPSJzMCIgZD0ibTIyIDBoNTc2YzEyLjE1IDAgMjIgOS44NSAyMiAyMnY1NzZjMCAxMi4xNS05Ljg1IDIyLTIyIDIyaC01NzZjLTEyLjE1IDAtMjItOS44NS0yMi0yMnYtNTc2YzAtMTIuMTUgOS44NS0yMiAyMi0yMnoiLz4KCTx1c2UgaWQ9ImltZzEiIGhyZWY9IiNpbWcxIiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzNCwwLDAsMS4zMzMsOTIuMDM2LDE2Ny4zMzMpIi8+Cgk8dXNlIGlkPSJpbWcyIiBocmVmPSIjaW1nMiIgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzQsMCwwLDEuMzMzLDI5My40OSwxNjYpIi8+Cjwvc3ZnPg==';


// ── Guard SearchAnalytics ─────────────────────────────────────
// Centralise tous les appels à SearchAnalytics.
// Sécurise contre un chargement manquant ou un ordre inattendu.
// Ne fait rien si SearchAnalytics n'est pas disponible ou si
// aucune recherche n'est active (query vide).
function _sa(query, items, module) {
    if (typeof SearchAnalytics === 'undefined') return;
    if (query && items && items.length) {
        SearchAnalytics.analyze(query, items, module);
    } else {
        SearchAnalytics.close();
    }
}

// ── Signature Pad State ───────────────────────────────────────
let _sigCanvas   = null;
let _sigCtx      = null;
let _sigDrawing  = false;
let _sigHasData  = false;

// ── Signature Pad Init ────────────────────────────────────────
function _initSignaturePad() {
    _sigCanvas = document.getElementById('signature-canvas');
    if (!_sigCanvas) return;

    // Calibrer le canvas à sa taille CSS réelle (évite le flou)
    const rect = _sigCanvas.getBoundingClientRect();
    _sigCanvas.width  = rect.width  || 476;
    _sigCanvas.height = rect.height || 200;

    _sigCtx = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth   = 2.5;
    _sigCtx.lineCap     = 'round';
    _sigCtx.lineJoin    = 'round';
    _sigHasData = false;

    // Nettoyer les anciens listeners en recréant le canvas clone
    const fresh = _sigCanvas.cloneNode(true);
    _sigCanvas.parentNode.replaceChild(fresh, _sigCanvas);
    _sigCanvas = fresh;
    _sigCtx    = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth   = 2.5;
    _sigCtx.lineCap     = 'round';
    _sigCtx.lineJoin    = 'round';

    function _pos(e) {
        const r = _sigCanvas.getBoundingClientRect();
        const scaleX = _sigCanvas.width  / r.width;
        const scaleY = _sigCanvas.height / r.height;
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
    }

    function _start(e) {
        e.preventDefault();
        _sigDrawing = true;
        _sigHasData = true;
        const { x, y } = _pos(e);
        _sigCtx.beginPath();
        _sigCtx.moveTo(x, y);
        // Masquer le placeholder dès le premier trait
        const ph = document.getElementById('signature-placeholder');
        if (ph) ph.style.display = 'none';
    }
    function _move(e) {
        e.preventDefault();
        if (!_sigDrawing) return;
        const { x, y } = _pos(e);
        _sigCtx.lineTo(x, y);
        _sigCtx.stroke();
    }
    function _end(e) { e.preventDefault(); _sigDrawing = false; }

    _sigCanvas.addEventListener('mousedown',  _start);
    _sigCanvas.addEventListener('mousemove',  _move);
    _sigCanvas.addEventListener('mouseup',    _end);
    _sigCanvas.addEventListener('mouseleave', _end);
    _sigCanvas.addEventListener('touchstart', _start, { passive: false });
    _sigCanvas.addEventListener('touchmove',  _move,  { passive: false });
    _sigCanvas.addEventListener('touchend',   _end,   { passive: false });
}

function clearSignaturePad() {
    if (!_sigCanvas || !_sigCtx) return;
    _sigCtx.clearRect(0, 0, _sigCanvas.width, _sigCanvas.height);
    _sigHasData = false;
    const ph = document.getElementById('signature-placeholder');
    if (ph) ph.style.display = '';
}

// ── Open Signature Modal ──────────────────────────────────────
function openSignatureModal(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);

    const infoEl = document.getElementById('signature-advance-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
                <div>📋 <strong>Réf.</strong> AVA-${String(advance.id).padStart(4,'0')}</div>
                <div>📅 <strong>Date :</strong> ${formatDate(advance.date)}</div>
                <div>👤 <strong>Collecteur :</strong> ${collector ? collector.name : '—'}</div>
                <div>💰 <strong>Montant :</strong> ${Math.abs(advance.amount).toLocaleString('fr-MG')} Ar</div>
            </div>`;
    }

    const hiddenId = document.getElementById('signature-advance-id');
    if (hiddenId) hiddenId.value = advanceId;

    openModal('signature-modal');

    // Init pad après ouverture (le canvas doit être visible pour getBoundingClientRect)
    setTimeout(_initSignaturePad, 80);
}

// ── Save Signature ────────────────────────────────────────────
async function saveSignature() {
    if (!_sigHasData) {
        showToast('Veuillez apposer la signature avant de confirmer.', 'error'); return;
    }

    const advanceId = parseInt(document.getElementById('signature-advance-id')?.value);
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }

    // Extraire la signature en base64 (PNG transparent)
    const signatureData = _sigCanvas.toDataURL('image/png');

    // Construire l'objet avance mis à jour (put complet requis par IndexedDB)
    const updated = Object.assign({}, advance, {
        signature:   signatureData,
        confirmedAt: new Date().toISOString()
    });

    await saveToDB('advances', updated);
    closeModal('signature-modal');
    showToast('✅ Signature enregistrée — réception confirmée !', 'success');
}

// ── Ticket Thermique 80mm ─────────────────────────────────────

// QR Code généré par QRCode.js (assets/qrcode.min.js) — 100% offline
// Même bibliothèque éprouvée que le module Réceptions.
/** Imprime un ticket thermique format 80mm pour une avance */
function printAdvanceTicket(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);
    const ref       = 'AVA-' + String(advance.id).padStart(4, '0');
    const collName  = collector ? collector.name : '—';
    const montant   = Math.abs(advance.amount).toLocaleString('fr-MG') + ' Ar';
    const dateFmt   = formatDate(advance.date);
    const confirmed = advance.confirmedAt
        ? new Date(advance.confirmedAt).toLocaleString('fr-FR')
        : '—';

    // Contenu QR — format multiligne lisible par les scanners standards
    const motifLine = advance.motif ? `\nMotif : ${advance.motif}` : '';
    const qrData = `N\u00b0 : ${ref}\nCollecteur : ${collName}\nMontant Avance : ${Math.abs(advance.amount).toLocaleString('fr-MG')} Ar\nDate : ${dateFmt}${motifLine}`;
    const qrHtml = '<div id="qr-container"></div>';

    const sigHtml = advance.signature
        ? `<div class="sig-block">
               <div class="label-sm">Signature collecteur</div>
               <img src="${advance.signature}" class="sig-img" alt="Signature">
           </div>`
        : '';

    const html = `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8">
<title>Ticket ${ref}</title>
<script src="../assets/qrcode.min.js"><\/script>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        color: #000;
        background: #fff;
        width: 72mm;          /* zone imprimable 80mm - marges */
        margin: 0 auto;
        padding: 4mm 2mm;
    }

    /* ── En-tête ── */
    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4mm; margin-bottom: 3mm; }
    .header .logo-img  { width: 12mm; height: 12mm; object-fit: contain; display: block; margin: 0 auto 2mm; }
    .header .logo-line { font-size: 14px; font-weight: bold; letter-spacing: 2px; }
    .header .subtitle  { font-size: 9px; color: #333; margin-top: 1mm; }
    .ref-badge { display: inline-block; border: 1px solid #000; padding: 1mm 3mm;
                 font-size: 12px; font-weight: bold; letter-spacing: 1px; margin: 2mm 0; }
    .doc-type  { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #333; }

    /* ── Montant central ── */
    .amount-block {
        text-align: center;
        border: 2px solid #000;
        border-radius: 2mm;
        padding: 3mm;
        margin: 3mm 0;
    }
    .amount-label { font-size: 9px; color: #555; margin-bottom: 1mm; }
    .amount-value { font-size: 18px; font-weight: bold; letter-spacing: 1px; }

    /* ── Lignes de données ── */
    .data-section { margin: 3mm 0; }
    .data-row {
        display: flex;
        justify-content: space-between;
        padding: 1mm 0;
        border-bottom: 1px dotted #bbb;
        gap: 4px;
    }
    .data-row:last-child { border-bottom: none; }
    .data-label { color: #444; flex-shrink: 0; min-width: 24mm; }
    .data-val   { font-weight: bold; text-align: right; word-break: break-all; }

    /* ── Séparateur ── */
    .sep { border: none; border-top: 1px dashed #000; margin: 3mm 0; }

    /* ── Motif ── */
    .motif-block { font-size: 10px; font-style: italic;
                   border-left: 2px solid #000; padding-left: 2mm; margin: 2mm 0; }

    /* ── QR Code ── */
    .qr-block { text-align: center; margin: 3mm 0; }
    .qr-block .label-sm { font-size: 9px; color: #555; margin-bottom: 2mm; }

    /* ── Signature ── */
    .sig-block { text-align: center; margin: 3mm 0; }
    .sig-block .label-sm { font-size: 9px; color: #555; margin-bottom: 1mm; }
    .sig-img { max-width: 56mm; max-height: 18mm; border: 1px solid #ccc;
               border-radius: 1mm; padding: 1mm; background: #fff; }

    /* ── Pied ── */
    .footer { text-align: center; font-size: 8px; color: #555;
              border-top: 1px dashed #000; padding-top: 3mm; margin-top: 3mm; }
    .footer .brand { font-size: 10px; font-weight: bold; letter-spacing: 1px; }

    @media print {
        body { width: 72mm; margin: 0; padding: 3mm 2mm; }
        @page { size: 80mm auto; margin: 0; }
    }
</style>
</head><body>

<!-- En-tête -->
<div class="header">
    <img src="${_LOGO_B64_ADV}" alt="RISEVANILLA" class="logo-img">
    <div class="logo-line">RISEVANILLA</div>
    <div class="subtitle">Gestion de Collecte de Vanille</div>
    <div style="margin-top:2mm;">
        <span class="ref-badge">${ref}</span>
    </div>
    <div class="doc-type">Ticket d'Avance</div>
</div>

<!-- Montant -->
<div class="amount-block">
    <div class="amount-label">MONTANT AVANCÉ</div>
    <div class="amount-value">${montant}</div>
</div>

<!-- Données -->
<div class="data-section">
    <div class="data-row">
        <span class="data-label">Collecteur</span>
        <span class="data-val">${collName}</span>
    </div>
    <div class="data-row">
        <span class="data-label">Date</span>
        <span class="data-val">${dateFmt}</span>
    </div>
    <div class="data-row">
        <span class="data-label">Référence</span>
        <span class="data-val">${ref}</span>
    </div>
    <div class="data-row">
        <span class="data-label">Confirmé le</span>
        <span class="data-val">${confirmed}</span>
    </div>
</div>

${advance.motif ? `<hr class="sep"><div class="motif-block">Motif : ${advance.motif}</div>` : ''}

<hr class="sep">

<!-- QR Code -->
<div class="qr-block">
    <div class="label-sm">Scanner pour vérification</div>
    ${qrHtml}
    <div style="font-size:8px;margin-top:2mm;color:#555;white-space:pre-line;line-height:1.5;">${qrData}</div>
</div>

${sigHtml ? `<hr class="sep">${sigHtml}` : ''}

<!-- Pied -->
<div class="footer">
    <div style="margin-bottom:1mm;">Imprimé le ${new Date().toLocaleString('fr-FR')}</div>
    <div class="brand">RISEVANILLA</div>
    <div>© ${new Date().getFullYear()} — Tous droits réservés</div>
</div>

<script>
function buildQR() {
    var el = document.getElementById('qr-container');
    if (!el) return;
    new QRCode(el, {
        text:         ${JSON.stringify(qrData)},
        width:        160,
        height:       160,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
}
function init() {
    if (typeof QRCode !== 'undefined') {
        buildQR();
    } else {
        setTimeout(init, 80);
    }
}
window.onload = function() {
    init();
    setTimeout(function() { window.print(); }, 700);
};
<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=360,height=700');
    if (!win) { showToast('Autorisez les popups pour imprimer le ticket.', 'error'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
}

// ── Generate PDF Receipt ──────────────────────────────────────
function generateAdvancePDF(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);
    const ref       = 'AVA-' + String(advance.id).padStart(4, '0');
    const confirmed = advance.confirmedAt
        ? new Date(advance.confirmedAt).toLocaleString('fr-FR')
        : '—';

    const sigHtml = advance.signature
        ? `<div style="margin-top:8px;">
               <div style="font-size:11px;color:#666;margin-bottom:4px;">Signature du collecteur :</div>
               <img src="${advance.signature}" style="max-width:260px;max-height:110px;border:1px solid #ddd;border-radius:6px;padding:4px;background:#fff;">
           </div>`
        : `<div style="margin-top:12px;padding:10px 16px;border:1px solid #ccc;border-radius:6px;font-style:italic;color:#555;font-size:12px;">
               ✔ Réception confirmée — signature non disponible
           </div>`;

    const html = `<!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8">
        <title>Reçu ${ref}</title>
        <style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:32px;max-width:600px;margin:0 auto;}
            .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #6750a4;padding-bottom:16px;margin-bottom:24px;}
            .header-title-container{display:flex;align-items:center;gap:10px;}
            .header-logo{width:32px;height:32px;object-fit:contain;}
            .header h1{font-size:20px;color:#6750a4;letter-spacing:.5px;margin:0;}
            .header .sub{font-size:11px;color:#888;margin-top:2px;}
            .badge{background:#6750a4;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
            .section{background:#f5f0ff;border-radius:10px;padding:16px;margin-bottom:16px;}
            .section h2{font-size:13px;color:#6750a4;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
            .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e8e0f7;}
            .row:last-child{border-bottom:none;}
            .row .label{color:#555;}
            .row .val{font-weight:600;}
            .amount{font-size:22px;font-weight:800;color:#6750a4;text-align:center;padding:14px;background:#ede7ff;border-radius:10px;margin:16px 0;letter-spacing:.5px;}
            .footer{margin-top:24px;border-top:1px solid #ddd;padding-top:12px;font-size:11px;color:#999;text-align:center;}
            .motif{background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px 14px;font-style:italic;font-size:12px;color:#444;margin-top:8px;}
            @media print{body{padding:16px;}}
        </style>
    </head><body>
        <div class="header">
            <div>
                <div class="header-title-container">
                    <img src="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYyMCA2MjAiIHdpZHRoPSI2MjAiIGhlaWdodD0iNjIwIj4KCTxkZWZzPgoJCTxpbWFnZSB3aWR0aD0iMTc0IiBoZWlnaHQ9IjE5NSIgaWQ9ImltZzEiIGhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSzRBQUFERENBTUFBQUFzdU5wWUFBQUFBWE5TUjBJQjJja3Nmd0FBQW9WUVRGUkY4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXckFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjZXaG9uQUFBQU5kMFVrNVRqUC93NU5uT3Y1cHJQQXNBcU42alhCTEJ4Mzh6RHRja0hPWE5iQ2p4MzE0Q1B2blZVZjdGSjNINmlRcVA0MHNCcnBBRUJza1k2ajhiL1Z0aWNGVitrWFJmTW9mZ0NXN3RqU0NlK3hZc2lPSDNEZUlGYVpORVBhWVBzUkJ6YlVmek1STmxxYmIxQXhueWQ5MnZZZXNpZkZpaWdjYnBET2pJTjFabm5LcSsyMnI4WUUzWUlYdElKYWM0MDl4SkhybHZGTkN3T3VaUTFvT0s5aFVIMFIvdmxCbzVuK2VydElzcEZ5Nnl1SVJVN2thU3c4eEFlSG1id0N1cytCMkZMN3FYTkdSb3Bjc0lja1U3TmV5MVhabTNobE85Mm1iME1NcFFpWm9FQUFBSlFrbEVRVlI0bk5XZGVYQlBWeFRIN3kyVDJsSlVZeXpWQ1EzU1lxclNsRlJSaVNXTUVWdEVSNGl0cGFGcUo0UVFTMHRWWTB1dFFZWldRNHJhMjZHMVRvdGFxblJYU3F1cU16clZsaWxEZjBra3Y3ZS8rNzN2M1h2YjcxL3YzWGVPMzRmMys3Mzc3cm5uSEpSUUlrVzBSSjcrbFBMMEw3K0kyRlFoUUh5TDE1bVdKeUcvKzBuRHBNcVUzdUJ5RE9DV28xZDlwbUZScVlxbC84UzlBcmdrbFA3aVB3NkRxbFA0dmhiZ0J1N05KUUUwREtwRndUdGJpRXVxMGgrRTRMaXJEcjJNbUJmaEJ1N0xkMEpvR0ZRWHViWDNjRW10cjhYQU1DaVMwdk9zdHNXNHBQWVpNVEFzYWtpL1o3UXN3WTJncDBUUk1LZ3haYnU3SmJnazhwejg2U0tvS0hxV3hTeUlxMmk2S0ZZMC9ZTEJTb05MR2gyOUk0ekdYYzFZdm8xYVhIWFRSYUVpcXA1MHRkSGhLcHd1Q3RYOGhKdUZIcGMwT1NpTWhVVVAzblF4TU9DcW5DNEsxT0l6NSt0R1hQTFVmbUVzTEdwMTFQR3lDVmZ0ZEVGSURjZW52d21YcUZoZGFQWGNFWWVMRnJocXB3c1NXZjFUKzRzV3VJcW5DMUx0aHYzSzB3cFg4WFJCS2xXMHZiMld1S1NoMC9kSHZHSS9zYnRpamF0eWRSRlF4S1g3Yks3WTRDcWVMdUxvWWVzTGRyaUtwNHVXeDZ6SGJYSFZUaGQyWHdkYlhNWFRSYW43TFljZGNOVk9GMjBQV1kwNjRLcWRMdG9kLzl0aTFBbFg3WFRSL29ERm9DT3UwdFZGWkxqRnM4a1pWK2wwMFdHZmVjd0ZWK1YwMFpGK1pCcHp3L1dvV0VyZjUzWis3SUpwU0RCdVFBMnJoR3poODZRSkg1aUdoT01HbmtsSG1tN2ljalF2M0dUZ0VoSlBOL0U4d2l2VU1mN1E1ZUFTOGt5bGt4elBtTVR0aGdGWnVJUjB1b24vNkpLMkdnYms0WkxPOUIzVUpiTEpadjJBUkZ4Q3VxNURQWkxmMDU5THhTWGRhUzdtVVBjbi9ibGNYSko0RitUdGw2YzdsWXhMN3NUdWdPd2YrVTEzS2h1WEpLMkN6QWVzMTUxS3h5WFByMFNzQjFIZHoxTStiakpkaXBpWDBhMHg1ZU9TYUl2M1dIc04wZjAyRmVDU2xMY0E0OVRWMmpNVnVQMFhBOGJEY3JSbktuRHJYMGJTUFY3Vy9qUlY0SkpCQ3dEalY1WnJUcFRnaG9ZQ0w1TzZ6U3NsdUtUbXQreTJJNVpwVHRUZ0RuNlQzWGJVRXMySkd0eXE1OWx0UjJzZmUycHdVK2NDeG0wMG9XazF1R1RvNit5MjlUU0JPa1c0dythdzI0NWZHRHhXaEpzQUxOdjY1QWVQRmVHMjJzbHVPMEV6cWZ3UGNOUG1CNDhWNFk2WXhXN2JXeE94VW9RN2NpYTc3WDhBZDlRTWRsdnRwb29pM05IVDJXMm5hT1lVTmJpOWEweGpOKzcvYnZCWURXN3NOc0JZbXo2aUJuZmNWTUI0MnV6Z3NScmNqaHNCNHlxYUlnQTF1Qk9tQU1aTlR3ZVBsZUNtVFFhTUk4cHBWa3BLY0NlbUE4YlIyclJ0SmJodGtMQi8xSmVhRXhXNGt5WWgxaUdsTlNjcWNKR1hYZjJrcGdJM2ZTSmtybDFNcU1DZG5BYVphMWVXQ25DblRJRE1aK3ZlTHFUalJ2WWFCOWszL2taN0poMjNubnMrdkU0emRTL3lzbkdualFVZHl1bk9KT05tanIyTE9ieWhuNi9sNHFabTNRWTk1dW5uYTZtNDRaZXZnUjdOa3ZRem9FemM1TWRIb0M3ekRjOW9pYml2WFFUaWVQZlV5RkRJSmcrMzd4SjNHNk1XampjTXlNS2RRNGR5ZUdXUE1Rekl3RzFkTHZZNk5wWGQweEk2MGpDQzRDS0JMVitrbjRBTGhPQm0wUmY4aEhGVjdiWnJqVVBRbDJFQkhlZ2pqYXR5aHBtR3NPL3VvNmZkYmZ6VEt2T3ZFL3lwelUzMWk4VmRWclYySUc3WXo5eWRJRkJsYnJMSXhVVWZaRDF6WmVXanI3YTZrZkJ6dDJ6WVYzN0F1R3JOUzFhaitEUXhKdE03aTd0eWQyMjJHdWFZMVpiMjhRempxb3l5MXY4b0hMamhRM21tZjB5OWJmS1RlZDRaS3NTRG1ZR3cxcjVvYzRIckZXZDhoaGNXZDgzNU5kdm1DdDhiMmZMZUhtQmNGZDM1VmJ0TGZMajFXOC9qcDNGVHUzNkRiSzl4dnUrdVBJNHZaQmpWdCtNQSs0dThyK2ZaZVZoaUs3TVNZcHllNjl5ckNVSFZOVFRSY2N1TmYvR3pLb25YMDBHWk5ZWTdYdWZIVFMwTDdPc3lLaS9GcFZ1Wmg2WGxpcjBydUgydHRXRzZXL2FlbDVWd2JnOStYd3ZsMDJSWEcwOEw5M1ZkUFRnYnRYbUhhU0ZwbGlmYytsTVRQSGpybEhGdEMwdmRyTGV3U1BJSjU5NGF6S3FRenZZVzdUR0tzMzZXYmJFL29NR2RMalBHSnIwR25mSTZlZk1QcU5ua2JITlJwWTA4eDhpbWovYjRCK3lnM2RtTlBlTjJ1YkxIZzNkR1RBNlM1K0pEQkRLbmNudGUxNVZsd3JwZ0hqNEVUQi82a2M5ditibWpOazBqN09WSGZQZjJQN2hQV0hJWWtQbFdJajl3NHp1QWdkVEpMV2xudm8veUpYcU9CbEpIUWtWS1d2a1Q3Ri9iRGJQZjJKZnpnM3phbTBBcUN3ck11NE5QaEdMNXRaV3lOUTR5SDdlSTcyUDh3dTJ5SGd1azd1V2J2SDNicU5yZUdyUC91Q1BQcC9pM3I3YXpGV1NlY2RaWXY4NGlIN2NCZDdXRXpBZjE0bmoyK29pYmRRc0xwQzRNTWU1SnVzdlBUZGEwcFZoZm1nTzBIZm9SdnU0Sm80SFUvZkhvSi9pN2hSMW43S2Znb2tOdHdRL3dlY2NkS1RBbzBPRTJtTDNQdUQzRHNFRHF3Nm5ZMzgvdmZJWTlNWmg5cmJnOGQ2T2dmRSsvbURFS3M2K1VpTFRFOEQ5YkJOMTJhNEIwdWZJZk4vd3EySFV0QnVpQ0p5QVhCdzJrN3E0WXkyd3JJblVJRGFSR1A4a1FleXlTa0V3bnRPVjdWaHJyZi9FaEJCZmVkdHN6Z1BIN0xpYVBiR1dkcHBnRDYrTkJVTm9iSEVnZHl0YlFSVlNXSHByeDZOZ2tPQ2hoU1lYb3RsdTFLSllncnpCY2VOdXRlZ09HQUorNGxNMFZWY0JBNnBGRTk4ZUR3QXpUZmRHZ3d6SDN0YW5JaE5odDdKTnJrWXpkeDh3U2lSdWZBbTY3WmN5MmE4SmNMS0hweHFIWndDNUpnZktYdS9SVUZwc2R2WFljMko0dzh3KzdwS0VpQ1U3bWpyTHFTdXVrZ1VjZC80S2ljODhQUklFT0cxS2Nyb3JHeGJmZEhuQ3FzeEdlMlo4ekZjeEl6UWh4Nk4wZ3ZoQUJiSjVIOUZYaUJrbW9teWgxSFhSd2VOdVJnSXZYTDFSdXZjdm1pb3lxbElHTHdKbzZ5N2JSaFpKUzg0TnV1eGtiL2dVbHAwVHBZQlBRSVdKRGM4dHhTUlZWaHh1akhnc3N5NGtsNGVMMUM5WnZPN0xxMWNvMlJUTlNUOFZaTk8yWFZnM1lqVG13Vkt6MEsrWlFxcnppUmJ4K29ZZjVoc2pERGI5NURuWDV2Smx4UkdJbEsxNi9ZTjZJbFZrbmpOY3ZuQjV1aU8xSXJjSnVzUnYxaUU3U2Q5Q1Jpc3RSdjdCNGpDNzBLN2NrbjZOK1FWOVBJN25oQVVmOWdpNjJJN3VkQk5hSnVWQXpOT1hKMHB0MWNOUXZQSHU4NUZBNkxrZjl3dTZhVHhjZnltODBrMzloQ09xU1c2MDQ3VXhCR3grTytvWEZHZmZlemxUMGRJSjZ2UldwdUNPS0NsdzRrQnJRaDBVdVN2cVJoVDVoK2g5eFhMV29zTU9EbWw1NkhQVUxTN2J0SmNxNmJFS2R6NHVVKy9aK1piaGttWHM1a2xGeFBVY3F3KzF5NENMc2N5WmFHUzVKWElQNzdJOVhoa3NhdzFVSWhMVDZGKzVYem1tL3cyQkFBQUFBQUVsRlRrU3VRbUNDIi8+CgkJPGltYWdlIHdpZHRoPSIxNDUiIGhlaWdodD0iMjM4IiBpZD0iaW1nMiIgaHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFKRUFBQUR1Q0FNQUFBQU9jaFVGQUFBQUFYTlNSMElCMmNrc2Z3QUFBUHhRVEZSRkFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjllM3YwUUFBQUZSMFVrNVRBRFAvOXZYMDgvSHc3Kzd0NitycDZPZmw1T1BpNE4vZTNkemEyZGpYMWRUVDB0SFB6czNNeXNuSXg4YkV3OExCUVpEc0NndGcvaXJBdUNCSWdBSjRFN0NnRlBvNGNOQ0kreDB1QlZDWU1GZ0lRS2hvMEs5WER3QUFCOU5KUkVGVWVKeTFuTTl2bFVVVWh2dXhjNHRibzB2RHFqVldrVkpBSzlTRVVpdjZkNnJGWDBSRnNWVEZpb2F3VW5adTNMSFdqU1o2eisyOXZlYzdNOS9NYytiTXM2QzN0Wk04SklaMzhyNzNmc05hUDRaaDhSWFIwZWlWSi96TVJrK2p6ZC8vNG9mV0gzYzBldTFYZm1aek9PbG85TWJQL016RmgydjlqTGIrK1lVZnV2UkRSNlB0SC9tWjh4ZU8reGxkZWZxTUg5cCtzTmJQNlBKRGZ1YmM1YU9PUm04KzRHZXUzVi9yWjdRejNIY2N1cmZXeitqR04vek15Ny9OL3V4bHRIdVBuM24xMGV6UFRrYlh2K1ZuTmdiNVI3NlQwVnRIL015TkwrVkxINlBOSi8vaU03dkRYZm5heDhnVHNsZS9tMy90WStRSjJmOGpUZWhpZFBNWkQ5a1hYanFlditoaTVMazh2djMxNllzZVJudEgvUElva1NiME1McjFCVCt6OStuaVZROGpUOGplK21UeHFvT1JKMlRua1NaME1McjZQVCt6ZjJmNU10N0ljM25jZVBGdytUcmU2UGFkOHUrTU9ZMDBJZDdJRWJLTFNCUENqVHdoKzk1SEs5K0VHMzN3TVQ5enNIb20zTWh4ZVZ4R21oQnQ5TzVuL016dEQxZS9pelp5aE95NWRYV2JDamJ5aE94WnBBbkJSbzZRM1J4TzFQZkJScGRPeXI4ejR2V2Y5UGV4UnA2R1puLzBiM3lza2FPaE9iOTlxSDhRYXVRSjJlM3haU3JVeUJHeXUzK1BZekRVNlAzRDh1K01VSkVtUkJwNUxvODdKblFpalJ3TnpmV3Z6SThpalJ3aHF5Tk5DRFJ5aE94cFFhTUlOTnIvSEI5WmYyeC9GbWZrdUR5T0kwMklNM0kwTkJkVERYT2NrYU9odVpuNlB5L015Qkd5SnRLRU1DTkh5SnBJRTZLTTloN2hrRDByYUJSUlJvN0w0N1YwNWtRWk9Sb2FHMmxDa0pFalpGY0tHa1dRa1NOazU1dURKY2JveXA5LzBDT3BTQk5pakJ5WHg5V0NSaEZqeEJ1YXplZnZadjVMaUpFalpKT1JKb1FZT1VKMnNUbFlRb3g0eU9xQ1JoRmg1SmhCbHB1REpjS0lOelNaU0JNQ2pCd056YWlnVVFRWU9VTDJiSE93QkJqeGtNMUZtdEJ1dFBVY0R0bHhRYU5vTitLWHg5WE53ZEpzNUdob3NwRW1OQnZ4a0ZXYmc2WFppSWVzTFdnVXJVYU9rRDJZM2lsYWpmZ01NaEZwUXFzUmIyZ1NCWTJpMFlnM05LUE53ZEpveEVOMkt0S0VOaU1lc3NtQ1J0Rm1kRkQ2Q3h2R200T2x6WWhmSGljalRXZ3k0ZzFOdXFCUk5CbnhrTjBxdnp1aHhZaUhiQ0hTaEJZai9rYlZRcVFKTFViODhwZ3BhQlFOUnJ5aFNXd09sZ1lqM3RDVUlrMW9NTUlobXkxb0ZINGpIcktwemNIaU44SXpTRG5TQkxjUnZ6em1DeHFGMjRnM05Nbk53ZUkyd2lGYkVXbUMxNGlIYkhwenNIaU4zc2tYUUdtbUNocUYwNGhmSGpPYmc4VnB4QnVhbWtnVG5FWTRaQ2NMR29YUGlJZHNibk93K0l4d3lOWkZtdUF5NGpQSWRFR2pjQm5oaGlhL09WaGNScmlocVl3MHdXUEVRemEvT1ZnOFJqaGtaeC9kcThaamRPRXBQRkFiYVlMRENGOGVxeU5OY0JqaGhxWlkwQ2k0RVEvWnFjM0J3bzF3eU5aSG1zQ044QnRWeXdXTkFodmh5K1AwNW1EQlJyaWhBWkVtVUNQYzBOUVVOQXBxaEVOMjhkRzlhcWdSRGxrU2FRSTAyam1HSVZ2YUhDelFDRjhlcXdvYUJUU2lEVTF4YzdBd0l4eXlMTklFWmtSRHRyS2dVU0FqL0x5Tzh1WmdRVWI0OGdnalRVQkd0S0dwTFdnVXhBaUhiTVhtWUNGR05HUnhwQW5BQ0lkc3plWmdBVVo0QmluTTZCbUFFVzFvZUtRSjlVYTRvZUdSSnRRYjBaQUZCWTJpM29pR2JOM21ZS2syb3MvcjhFU2FVRzFFTDQra29GSFVHdUdHcG5KenNOUWEwWkIxUlpwUWEwUkRGaFUwaWtvaitrWlYrOUc5YWlxTjZPWFJGMmxDblJGdWFLbzNCMHVkRVcxb1lFR2pxRE9pSVZ1L09WaXFqR2pJZWlOTnFES2l6K3VnQlkyaXhvaGVIc25tWUtreG9nMk5POUtFR2lNYXNyaWdVVlFZMFpCRm00T2x3b2krVWRVZmFVS0ZFYnc4c3MzQlVqYWlEVTMxako2aGJFUkR0aUhTaEtJUkRkbVdTQk9LUmpSa1BRV05vbWdFWnhDNk9WaEtSclNoYVlvMG9XUUVHeHBmUWFNb0dOR1F4WnVEcFdCRVE3WXQwb1NDRVh4ZWg3T2dVVXdiMGN2anhFZjNxcGsyZ2cxTmE2UUowMFl3WkIyYmcyWFNDSWFzdTZCUlRCckJrUFZzRHBZcEl6cURORWVhTUdVRUd4cC9RYU9ZTW9JTmpXdHpzRXdZd1pBTmlEUmh3Z2lHYkVOQm84Z2IwZWQxK0RZSFM5NElYaDRqSWszSUc4R0d4cms1V0xKR01HU2JDaHBGMWdpR3JIZHpzT1NNNEJ0Vll5Sk55Qm5CeTJOYlFhUElHY0dHeHIwNVdESkdzS0VKaWpRaFl3UkR0ckdnVVdTTVdNZzJiQTZXdEJHY1FhSWlUVWdid2N0amEwR2pTQnJCaHFicW8zdlZKSTFneUlaRm1wQTBZaUViRjJsQ3lnZytyNk85b0ZHa2pOamxzVzF6c0NTTVlFTVRHR2xDd2dpR2JFQkJvMGdZc1pCdDNCd3MxZ2lHYkdTa0NkYUl6U0FoQlkzQ0dyR0dwblZ6c0JnajJOQ0VScHBnakZqSU5tOE9sckVSRE5tWWdrWXhObUxQNjJqZkhDeGpJM1o1REk0MFlXVEVHcHFvZ2tZeE1tSWhHN0E1V0xRUkRObm9TQk8wRVh1amFsaEJvOUJHN1BJWXNUbFlsQkZyYU9JalRWQkdyS0VKMlJ3c3lvaUZMUHZvWGpXclJpeGtPMFNhc0dyRW50ZlJJZEtFRlNOMmVZd3NhQlFyUnF5aENkb2NMQ3RHS0dTN1JKcHdac1JDTnJTZ1Vad1pzZWQxUkcwT2xxVVJ1enoyaVRSaGFjUWFtdGlDUnJFMFFpSHIrT2hlTlFzakZyS2RJazFZR0tHUURkd2NMS2RHYkFhSkxtZ1VwMGFzb1FuY0hDeW5ScWloNlJacHd0eUloV3g0UWFPWUc2R1FEZDBjTEhNajlMeU9mcEVtaUJHN1BNWVhOQW94UWcxTjdPWmdtUm14a08wWWFjTE1DSVZzOE9aZ21SbWhONnJHemVnWkJuaDU3QnBwd2dBYm1xNlJKZ3l3b2VsUzBDZ0dGckxobTRObFlDSGJOOUtFQVQydm8xTkJveGpRNVRGK2M3QU1xS0hwSEduQ2YwMm1IbkF2QmhQR0FBQUFBRWxGVGtTdVFtQ0MiLz4KCTwvZGVmcz4KCTxzdHlsZT4KCQkuczAgeyBmaWxsOiAjMDAwMDAwIH0gCgk8L3N0eWxlPgoJPHBhdGggaWQ9IkNhbHF1ZSAxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsYXNzPSJzMCIgZD0ibTIyIDBoNTc2YzEyLjE1IDAgMjIgOS44NSAyMiAyMnY1NzZjMCAxMi4xNS05Ljg1IDIyLTIyIDIyaC01NzZjLTEyLjE1IDAtMjItOS44NS0yMi0yMnYtNTc2YzAtMTIuMTUgOS44NS0yMiAyMi0yMnoiLz4KCTx1c2UgaWQ9ImltZzEiIGhyZWY9IiNpbWcxIiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzNCwwLDAsMS4zMzMsOTIuMDM2LDE2Ny4zMzMpIi8+Cgk8dXNlIGlkPSJpbWcyIiBocmVmPSIjaW1nMiIgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzQsMCwwLDEuMzMzLDI5My40OSwxNjYpIi8+Cjwvc3ZnPg==" class="header-logo">
                    <h1>RISEVANILLA</h1>
                </div>
                <div class="sub">Gestion de Collecte de Vanille</div>
            </div>
            <div>
                <div class="badge">${ref}</div>
                <div style="font-size:10px;color:#999;text-align:right;margin-top:4px;">REÇU D'AVANCE</div>
            </div>
        </div>

        <div class="amount">${Math.abs(advance.amount).toLocaleString('fr-MG')} Ar</div>

        <div class="section">
            <h2>📋 Détails de la transaction</h2>
            <div class="row"><span class="label">Collecteur</span><span class="val">${collector ? collector.name : '—'}</span></div>
            <div class="row"><span class="label">Date de l'avance</span><span class="val">${formatDate(advance.date)}</span></div>
            <div class="row"><span class="label">Référence</span><span class="val">${ref}</span></div>
            <div class="row"><span class="label">Confirmation réception</span><span class="val">${confirmed}</span></div>
        </div>

        ${advance.motif ? `<div class="section"><h2>📝 Motif</h2><div class="motif">${advance.motif}</div></div>` : ''}

        <div class="section">
            <h2>✍️ Preuve de réception</h2>
            ${sigHtml}
        </div>

        <div class="footer">
            Document généré le ${new Date().toLocaleString('fr-FR')} — RISEVANILLA © ${new Date().getFullYear()}
        </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=680,height=820');
    if (!win) { showToast('Autorisez les popups pour générer le reçu.', 'error'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

// ── Helpers locaux ────────────────────────────────────────────

/** Retourne la date du jour au format YYYY-MM-DD */
function _todayISO() {
    return new Date().toISOString().split('T')[0];
}

/** Parse un montant depuis un string, retourne 0 si invalide */
function _parseAmount(str) {
    const raw = String(str || '').replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
}

/** Recharge le select collecteur dans le formulaire avance */
function _populateAdvanceCollectorSelect() {
    const select = document.getElementById('advance-collector');
    if (!select) return;
    const current = select.value;
    while (select.children.length > 1) select.removeChild(select.lastChild);
    (appData.collectors || [])
        .filter(isCollectorAvailableInCurrentYear)
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    select.value = current;
    // Réinitialiser l'affichage du solde
    _updateAdvanceCollectorBalance();
}

/** Met à jour l'affichage du solde du collecteur dans le formulaire d'avance */
function _updateAdvanceCollectorBalance() {
    const select = document.getElementById('advance-collector');
    const info   = document.getElementById('advance-collector-balance-info');
    const text   = document.getElementById('advance-balance-text');
    const icon   = document.getElementById('advance-balance-icon');
    const amount = document.getElementById('advance-balance-amount');

    if (!select || !info || !text) return;

    const collectorId = parseInt(select.value);
    if (!collectorId) {
        info.style.display = 'none';
        return;
    }

    const balance = calculateCollectorBalance(collectorId);
    info.style.display = 'flex';

    // Supprimer les classes d'état précédentes
    info.classList.remove('balance-info--credit', 'balance-info--debit', 'balance-info--neutral');

    if (balance > 0) {
        // Créditeur (RiseVanilla doit de l'argent au collecteur)
        info.classList.add('balance-info--credit');
        if (icon) icon.textContent = 'trending_up';
        if (text) text.textContent = 'Solde créditeur';
        if (amount) amount.textContent = formatCurrency(balance);
        else text.innerHTML = `Solde restant : <strong>${formatCurrency(balance)}</strong> <span class="balance-info__tag crediteur">Créditeur</span>`;
    } else if (balance < 0) {
        // Débiteur (Le collecteur doit de l'argent à RiseVanilla)
        info.classList.add('balance-info--debit');
        if (icon) icon.textContent = 'trending_down';
        if (text) text.textContent = 'Montant dû';
        if (amount) amount.textContent = formatCurrency(Math.abs(balance));
        else text.innerHTML = `Montant dû : <strong>${formatCurrency(Math.abs(balance))}</strong> <span class="balance-info__tag debiteur">Débiteur</span>`;
    } else {
        // Neutre
        info.classList.add('balance-info--neutral');
        if (icon) icon.textContent = 'check_circle';
        if (text) text.textContent = 'Solde équilibré';
        if (amount) amount.textContent = formatCurrency(0);
        else text.innerHTML = `Solde : <strong>0 Ar</strong> <span class="balance-info__tag equilibre">Équilibré</span>`;
    }
}

/** Recharge le select collecteur dans les filtres */
function _populateAdvanceFilterSelect() {
    const select = document.getElementById('advance-filter-collector');
    if (!select) return;
    const current = select.value;
    while (select.children.length > 1) select.removeChild(select.lastChild);
    (appData.collectors || [])
        .filter(isCollectorAvailableInCurrentYear)
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    select.value = current;
}

// ── Table des avances ─────────────────────────────────────────

function updateAdvancesTable() {
    const tbody = document.getElementById('advances-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const filtered = _filterAdvancesData();

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">account_balance_wallet</div>
                <div>Aucune avance enregistrée</div>
            </td></tr>`;
        // Total = 0
        _setAdvancesTotal(0);
        _sa('', null, 'advances');   // ferme le panneau
        return;
    }

    getPaginatedData(filtered, 'advances').forEach(adv => {
        const collector = (appData.collectors || []).find(c => c.id === adv.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(adv.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant">${formatCurrency(adv.amount)}</td>
            <td data-label="Motif">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    ${adv.vanilleType === 'verte'
                        ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(0, 230, 118, 0.15);color:#00e676;font-weight:700;border:1px solid rgba(0, 230, 118, 0.3);box-shadow: 0 0 8px rgba(0, 230, 118, 0.15);"><span class="material-icons" style="font-size:11px;">grass</span>Verte</span>`
                        : adv.vanilleType === 'preparee'
                        ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(152,144,168,.10);color:var(--md-sys-color-primary);font-weight:700;border:1px solid rgba(152,144,168,0.2);"><span class="material-icons" style="font-size:11px;">verified</span>Préparée</span>`
                        : ''}
                    <span>${RiseVanillaSearch.highlightText(adv.motif || '—', _q)}</span>
                </div>
            </td>
            <td class="actions-cell">
                ${adv.signature
                    ? `<button class="btn btn-icon" title="Réception confirmée ✓"
                               style="color:#4caf50;cursor:default;" disabled>
                           <span class="material-icons">verified</span>
                       </button>
                       <button class="btn btn-icon btn-outline" onclick="generateAdvancePDF(${adv.id})" title="Générer le reçu PDF">
                           <span class="material-icons">picture_as_pdf</span>
                       </button>
                       <button class="btn btn-icon btn-outline" onclick="printAdvanceTicket(${adv.id})" title="Imprimer ticket thermique 80mm">
                           <span class="material-icons">receipt_long</span>
                       </button>`
                    : `<button class="btn btn-icon btn-outline" onclick="openSignatureModal(${adv.id})" title="Faire signer le collecteur"
                               style="color:var(--md-sys-color-primary);border-color:var(--md-sys-color-primary);">
                           <span class="material-icons">draw</span>
                       </button>`
                }
                <button class="btn btn-icon btn-outline" onclick="openAdvanceModal(${adv.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteAdvance(${adv.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        // Avatar collecteur
        const collTd = row.querySelector('td[data-label="Collecteur"]');
        if (collTd) {
            if (collector) {
                collTd.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
                const avatarCell = renderCollectorAvatar(collector, false);
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = RiseVanillaSearch.highlightText(collector.name, _q);
                avatarCell.appendChild(nameSpan);
                collTd.appendChild(avatarCell);
            } else {
                collTd.innerHTML = '<em style="opacity:.6">Supprimé</em>';
            }
        }
        tbody.appendChild(row);
    });

    // Pagination
    let pDiv = tableWrapper?.querySelector('.pagination-controls');
    if (!pDiv && tableWrapper) {
        pDiv = document.createElement('div');
        pDiv.className = 'pagination-controls';
        tableWrapper.appendChild(pDiv);
    }
    if (pDiv) pDiv.innerHTML = createPaginationControls('advances', filtered.length);

    // Total
    _setAdvancesTotal(filtered.reduce((s, a) => s + (a.amount || 0), 0));

    initTableSorting();

    // ── SearchAnalytics : agrégats avances si recherche active ──────────
    const _q = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_q) {
        const _enriched = filtered.map(a => {
            const c = (appData.collectors || []).find(col => col.id === a.collectorId);
            return Object.assign({}, a, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_q, _enriched, 'advances');
    } else {
        _sa('', null, 'advances');
    }
}

function _filterAdvancesData() {
    let data = getAdvancesForCurrentYear();

    const collectorFilter = document.getElementById('advance-filter-collector')?.value;
    const startDate       = document.getElementById('advance-filter-start')?.value;
    const endDate         = document.getElementById('advance-filter-end')?.value;

    if (collectorFilter) data = data.filter(a => String(a.collectorId) === String(collectorFilter));
    if (startDate)       data = data.filter(a => a.date >= startDate);
    if (endDate)         data = data.filter(a => a.date <= endDate);

    return data.sort((a, b) => b.date.localeCompare(a.date));
}

function _setAdvancesTotal(total) {
    const el = document.getElementById('advances-total');
    if (el) el.textContent = formatCurrency(total);
}

// Alias pour compatibilité avec updateAllTables()
// (notre table.js appelle updateAdvancesTable directement)

// ── Filtres avances ───────────────────────────────────────────

function filterAdvances() {
    return _filterAdvancesData();
}

function filterAdvancesByDate() {
    updateAdvancesTable();
}

function setDateFilter(period) {
    const now   = new Date();
    const today = _todayISO();
    let start   = today, end = today;

    if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (period === 'year') {
        start = `${now.getFullYear()}-01-01`;
        end   = `${now.getFullYear()}-12-31`;
    }

    const s = document.getElementById('advance-filter-start');
    const e = document.getElementById('advance-filter-end');
    if (s) s.value = start;
    if (e) e.value = end;
    updateAdvancesTable();
}

function clearDateFilter() {
    const s = document.getElementById('advance-filter-start');
    const e = document.getElementById('advance-filter-end');
    if (s) s.value = '';
    if (e) e.value = '';
    updateAdvancesTable();
}

function resetAdvancesFilters() {
    ['advance-filter-collector', 'advance-filter-start', 'advance-filter-end']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    updateAdvancesTable();
}

// ── Modal Avance ──────────────────────────────────────────────

function openAdvanceModal(advanceId = null) {
    const form = document.getElementById('advance-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    // Titre dynamique
    const titleEl = document.getElementById('advance-modal-title') ||
                    form.closest('.modal')?.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = advanceId ? 'Modifier l\'Avance' : 'Nouvelle Avance';

    // Populate select collecteur
    _populateAdvanceCollectorSelect();

    // Date par défaut
    const dateEl = document.getElementById('advance-date');
    if (dateEl && !advanceId) dateEl.value = _todayISO();

     if (advanceId) {
        const advance = (appData.advances || []).find(a => a.id === advanceId);
        if (advance) {
            form.dataset.editId = advanceId;
            document.getElementById('advance-date').value      = advance.date;
            document.getElementById('advance-collector').value = advance.collectorId;
            // Afficher le montant formaté
            const amtEl = document.getElementById('advance-amount');
            if (amtEl) amtEl.value = advance.amount.toLocaleString('fr-MG');
            document.getElementById('advance-motif').value     = advance.motif || '';
            // Restituer vanilleType
            const typeEl = document.getElementById('advance-vanille-type');
            if (typeEl) typeEl.value = advance.vanilleType || '';
        }
    }

    // Mettre à jour le solde immédiatement
    _updateAdvanceCollectorBalance();

    openModal('advance-modal');
    setTimeout(() => document.getElementById('advance-date')?.focus(), 200);
}

function saveAdvance(event) {
    if (event) event.preventDefault();
    const form        = document.getElementById('advance-form');
    const editId      = form?.dataset.editId;
    const date        = document.getElementById('advance-date')?.value;
    const collectorId = parseInt(document.getElementById('advance-collector')?.value);
    const amount      = _parseAmount(document.getElementById('advance-amount')?.value);
    const motif       = document.getElementById('advance-motif')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const vanilleType = document.getElementById('advance-vanille-type')?.value || '';
    const data = { date, collectorId, amount, motif, vanilleType, createdAt: new Date().toISOString() };
    if (editId) data.id = parseInt(editId);

    saveToDB('advances', data, () => {
        closeModal('advance-modal');
        showToast(editId ? 'Avance modifiée' : 'Avance enregistrée', 'success');
    });
}

async function deleteAdvance(id) {
    const ok = await confirmModal({
        title:       'Supprimer l\'avance',
        message:     'Cette action est irréversible. L\'avance sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('advances', id, () => showToast('Avance supprimée.', 'warning'));
}

// ── Modal Remboursement ───────────────────────────────────────

function openRemboursementModal(collectorId, remboursementId = null) {
    const form = document.getElementById('remboursement-form');
    if (!form) return;
    form.reset();

    const editIdEl = document.getElementById('remboursement-edit-id');
    if (editIdEl) editIdEl.value = '';

    const collector = (appData.collectors || []).find(c => c.id === collectorId);
    const nameEl    = document.getElementById('remboursement-collector-name');
    const idEl      = document.getElementById('remboursement-collector-id');
    const dateEl    = document.getElementById('remboursement-date');

    if (idEl)   idEl.value   = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (dateEl) dateEl.value = _todayISO();

    // Pré-remplir le montant avec le solde dû du collecteur (nouveau remboursement uniquement)
    if (!remboursementId) {
        const balance = typeof calculateCollectorBalance === 'function'
            ? calculateCollectorBalance(collectorId)
            : 0;
        // Solde débiteur = balance négative (le collecteur doit de l'argent)
        const due = balance < 0 ? Math.abs(balance) : 0;
        const amtEl = document.getElementById('remboursement-amount');
        if (amtEl) amtEl.value = due > 0 ? due.toLocaleString('fr-MG') : '';

        // Stocker le montant dû pour validation + afficher l'indicateur
        const btn     = document.getElementById('remb-fill-total-btn');
        const dueInfo = document.getElementById('remboursement-due-info');
        if (btn) {
            btn.dataset.due = due;
            btn.disabled    = due <= 0;
        }
        if (dueInfo) {
            if (due > 0) {
                dueInfo.style.display = 'block';
                dueInfo.innerHTML = `Solde dû : <strong>${due.toLocaleString('fr-MG')} Ar</strong>
                    <span style="opacity:.7;">— saisie partielle autorisée</span>`;
            } else {
                dueInfo.style.display = 'block';
                dueInfo.innerHTML = `<span style="color:var(--md-sys-color-primary);">✓ Aucune dette — collecteur équilibré ou créditeur</span>`;
            }
        }
    } else {
        // En mode édition : masquer l'indicateur et le bouton totalité
        const btn     = document.getElementById('remb-fill-total-btn');
        const dueInfo = document.getElementById('remboursement-due-info');
        if (btn) { btn.dataset.due = 0; btn.style.display = 'none'; }
        if (dueInfo) dueInfo.style.display = 'none';
    }

    if (remboursementId) {
        const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
        if (remb) {
            if (editIdEl) editIdEl.value = remboursementId;
            const amtEl  = document.getElementById('remboursement-amount');
            const noteEl = document.getElementById('remboursement-note');
            if (amtEl)  amtEl.value  = remb.amount.toLocaleString('fr-MG');
            if (dateEl) dateEl.value = remb.date;
            if (noteEl) noteEl.value = remb.note || '';
        }
    }

    openModal('remboursement-modal');
}

/** Remplit le champ montant avec la totalité du solde dû */
function fillTotalRemboursement() {
    const btn   = document.getElementById('remb-fill-total-btn');
    const amtEl = document.getElementById('remboursement-amount');
    if (!btn || !amtEl) return;
    const due = parseFloat(btn.dataset.due || 0);
    if (due > 0) {
        amtEl.value = due.toLocaleString('fr-MG');
        amtEl.focus();
    }
}

function openRemboursementModalToEdit(remboursementId) {
    const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
    if (remb) openRemboursementModal(remb.collectorId, remboursementId);
}

function saveRemboursement(event) {
    if (event) event.preventDefault();

    const editIdEl    = document.getElementById('remboursement-edit-id');
    const collectorId = parseInt(document.getElementById('remboursement-collector-id')?.value);
    const amount      = _parseAmount(document.getElementById('remboursement-amount')?.value);
    const date        = document.getElementById('remboursement-date')?.value;
    const note        = document.getElementById('remboursement-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validation : montant ne peut pas dépasser le solde dû (nouveau remboursement uniquement)
    if (!editIdEl?.value) {
        const balance = typeof calculateCollectorBalance === 'function'
            ? calculateCollectorBalance(collectorId) : 0;
        const due = balance < 0 ? Math.abs(balance) : 0;
        if (due > 0 && amount > due) {
            showToast(
                `Montant (${amount.toLocaleString('fr-MG')} Ar) supérieur au solde dû (${due.toLocaleString('fr-MG')} Ar)`,
                'error', 4000
            );
            return;
        }
    }

    const data = { collectorId, amount, date, note, createdAt: new Date().toISOString() };
    if (editIdEl && editIdEl.value) data.id = parseInt(editIdEl.value);

    saveToDB('remboursements', data, () => {
        closeModal('remboursement-modal');
        showToast('Remboursement enregistré', 'success');
    });
}

async function deleteRemboursement(id) {
    const ok = await confirmModal({
        title:       'Supprimer le remboursement',
        message:     'Cette action est irréversible. Le remboursement sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('remboursements', id, () => showToast('Remboursement supprimé.', 'warning'));
}

// ── Remboursements Table ──────────────────────────────────────

function updateRemboursementsTable() {
    const tbody = document.getElementById('remboursements-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const rembs = getRemboursementsForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!rembs.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">paid</div>
                <div>Aucun remboursement pour ${currentYear}</div>
            </td></tr>`;
        _sa('', null, 'remboursements');   // ferme le panneau
        return;
    }

    rembs.forEach(r => {
        const collector = (appData.collectors || []).find(c => c.id === r.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(r.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant Remboursé">${formatCurrency(r.amount)}</td>
            <td data-label="Note">${RiseVanillaSearch.highlightText(r.note || '—', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="openRemboursementModalToEdit(${r.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteRemboursement(${r.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        // Avatar collecteur
        const collTd = row.querySelector('td[data-label="Collecteur"]');
        if (collTd) {
            if (collector) {
                collTd.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
                const avatarCell = renderCollectorAvatar(collector, false);
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = RiseVanillaSearch.highlightText(collector.name, _q);
                avatarCell.appendChild(nameSpan);
                collTd.appendChild(avatarCell);
            } else {
                collTd.innerHTML = '<em style="opacity:.6">Supprimé</em>';
            }
        }
        tbody.appendChild(row);
    });

    // ── SearchAnalytics : agrégats remboursements si recherche active ───
    const _qR = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_qR) {
        const _enrichedR = rembs.map(r => {
            const c = (appData.collectors || []).find(col => col.id === r.collectorId);
            return Object.assign({}, r, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_qR, _enrichedR, 'remboursements');
    } else {
        _sa('', null, 'remboursements');
    }
}

// ── Signature Pad — Paiement Solde Créditeur (pad dédié) ─────
let _cpSigCanvas  = null;
let _cpSigCtx     = null;
let _cpSigDrawing = false;
let _cpSigHasData = false;

function _initCpSignaturePad() {
    _cpSigCanvas = document.getElementById('cp-signature-canvas');
    if (!_cpSigCanvas) return;

    const rect = _cpSigCanvas.getBoundingClientRect();
    _cpSigCanvas.width  = rect.width  || 476;
    _cpSigCanvas.height = rect.height || 160;

    _cpSigCtx = _cpSigCanvas.getContext('2d');
    _cpSigCtx.strokeStyle = '#1a1a2e';
    _cpSigCtx.lineWidth   = 2.5;
    _cpSigCtx.lineCap     = 'round';
    _cpSigCtx.lineJoin    = 'round';
    _cpSigHasData = false;

    // Cloner pour purger les anciens listeners
    const fresh = _cpSigCanvas.cloneNode(true);
    _cpSigCanvas.parentNode.replaceChild(fresh, _cpSigCanvas);
    _cpSigCanvas = fresh;
    _cpSigCtx    = _cpSigCanvas.getContext('2d');
    _cpSigCtx.strokeStyle = '#1a1a2e';
    _cpSigCtx.lineWidth   = 2.5;
    _cpSigCtx.lineCap     = 'round';
    _cpSigCtx.lineJoin    = 'round';

    function _pos(e) {
        const r = _cpSigCanvas.getBoundingClientRect();
        const scaleX = _cpSigCanvas.width  / r.width;
        const scaleY = _cpSigCanvas.height / r.height;
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
    }
    function _start(e) {
        e.preventDefault();
        _cpSigDrawing = true;
        _cpSigHasData = true;
        const { x, y } = _pos(e);
        _cpSigCtx.beginPath();
        _cpSigCtx.moveTo(x, y);
        const ph = document.getElementById('cp-signature-placeholder');
        if (ph) ph.style.display = 'none';
    }
    function _move(e) {
        e.preventDefault();
        if (!_cpSigDrawing) return;
        const { x, y } = _pos(e);
        _cpSigCtx.lineTo(x, y);
        _cpSigCtx.stroke();
    }
    function _end(e) { e.preventDefault(); _cpSigDrawing = false; }

    _cpSigCanvas.addEventListener('mousedown',  _start);
    _cpSigCanvas.addEventListener('mousemove',  _move);
    _cpSigCanvas.addEventListener('mouseup',    _end);
    _cpSigCanvas.addEventListener('mouseleave', _end);
    _cpSigCanvas.addEventListener('touchstart', _start, { passive: false });
    _cpSigCanvas.addEventListener('touchmove',  _move,  { passive: false });
    _cpSigCanvas.addEventListener('touchend',   _end,   { passive: false });
}

function clearCpSignaturePad() {
    if (!_cpSigCanvas || !_cpSigCtx) return;
    _cpSigCtx.clearRect(0, 0, _cpSigCanvas.width, _cpSigCanvas.height);
    _cpSigHasData = false;
    const ph = document.getElementById('cp-signature-placeholder');
    if (ph) ph.style.display = '';
}

// ── Paiements Solde Créditeur ─────────────────────────────────

function payCollectorCredit(collectorId) {
    const collector = (appData.collectors || []).find(c => c.id === collectorId);
    const balance   = calculateCollectorBalance(collectorId);
    if (balance <= 0) {
        showToast('Ce collecteur n\'a pas de solde créditeur.', 'error');
        return;
    }
    const nameEl   = document.getElementById('credit-payment-collector-name');
    const idEl     = document.getElementById('credit-payment-collector-id');
    const balEl    = document.getElementById('credit-payment-balance');
    const dateEl   = document.getElementById('credit-payment-date');
    const amtEl    = document.getElementById('credit-payment-amount');
    const noteEl   = document.getElementById('credit-payment-note');

    if (idEl)   idEl.value   = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (balEl)  balEl.value  = formatCurrency(balance);
    if (dateEl) dateEl.value = _todayISO();
    if (amtEl)  amtEl.value  = '';
    if (noteEl) noteEl.value = '';

    // Indicateur de solde créditeur + données du bouton "Payer tout"
    const fillBtn   = document.getElementById('cp-fill-total-btn');
    const creditInfo = document.getElementById('cp-credit-info');
    if (fillBtn) {
        fillBtn.dataset.credit = balance;
        fillBtn.disabled = false;
    }
    if (creditInfo) {
        creditInfo.style.display = 'block';
        creditInfo.innerHTML = `Solde créditeur : <strong>${balance.toLocaleString('fr-MG')} Ar</strong>
            <span style="opacity:.7;">— saisie partielle autorisée</span>`;
    }

    // Réinitialiser le pad de signature
    _cpSigHasData = false;
    const ph = document.getElementById('cp-signature-placeholder');
    if (ph) ph.style.display = '';

    openModal('credit-payment-modal');
    // Init pad après ouverture (canvas doit être visible)
    setTimeout(_initCpSignaturePad, 80);
}

/** Remplit le champ montant avec la totalité du solde créditeur */
function setCreditPaymentToFullBalance() {
    const fillBtn = document.getElementById('cp-fill-total-btn');
    const amtEl   = document.getElementById('credit-payment-amount');
    if (!fillBtn || !amtEl) return;
    const credit = parseFloat(fillBtn.dataset.credit || 0);
    if (credit > 0) {
        amtEl.value = credit.toLocaleString('fr-MG');
        amtEl.focus();
    }
}

function formatCreditPaymentAmount(input) {
    let raw = input.value.replace(/\D/g, '');
    if (!raw) { input.value = ''; return; }
    input.value = Number(raw).toLocaleString('fr-MG');
}

function submitCreditPayment(event) {
    if (event) event.preventDefault();
    const collectorId = parseInt(document.getElementById('credit-payment-collector-id')?.value);
    const amount      = _parseAmount(document.getElementById('credit-payment-amount')?.value);
    const date        = document.getElementById('credit-payment-date')?.value;
    const note        = document.getElementById('credit-payment-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validation : montant ne peut pas dépasser le solde créditeur
    const balance = typeof calculateCollectorBalance === 'function'
        ? calculateCollectorBalance(collectorId) : 0;
    const credit = balance > 0 ? balance : 0;
    if (credit > 0 && amount > credit) {
        showToast(
            `Montant (${amount.toLocaleString('fr-MG')} Ar) supérieur au solde créditeur (${credit.toLocaleString('fr-MG')} Ar)`,
            'error', 4000
        );
        return;
    }

    // Signature obligatoire
    if (!_cpSigHasData) {
        showToast('Veuillez apposer la signature du collecteur avant de valider.', 'error');
        // Scroll vers la zone signature
        const sigSection = document.getElementById('cp-signature-canvas');
        if (sigSection) sigSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const signatureData = _cpSigCanvas ? _cpSigCanvas.toDataURL('image/png') : null;
    const data = {
        collectorId, amount, date, note,
        signatureData,
        confirmedAt: new Date().toISOString(),
        createdAt:   new Date().toISOString()
    };
    saveToDB('paiements', data, () => {
        closeModal('credit-payment-modal');
        showToast('✅ Paiement enregistré et signé !', 'success');
    });
}

async function deletePaiement(id) {
    const ok = await confirmModal({
        title:       'Supprimer le paiement',
        message:     'Cette action est irréversible. Le paiement de solde sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('paiements', id, () => showToast('Paiement supprimé.', 'warning'));
}

/** Affiche la signature d'un paiement dans un mini-modal */
function viewPaiementSignature(paiementId) {
    const p = (appData.paiements || []).find(x => x.id === paiementId);
    if (!p || !p.signatureData) { showToast('Signature introuvable.', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === p.collectorId);

    const modalId = 'paiement-sig-preview-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="modal-content" style="max-width:420px;width:95%;">
            <div class="modal-header">
                <h3 class="modal-title">
                    <span class="material-icons" style="color:#2e7b32;">verified</span>
                    Signature — Paiement confirmé
                </h3>
                <button class="close-btn" onclick="closeModal('${modalId}')">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div style="padding:20px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;
                            font-size:13px;margin-bottom:16px;
                            padding:12px;border-radius:10px;
                            background:var(--md-sys-color-surface-variant);">
                    <div><span style="opacity:.7;">Collecteur</span><br>
                         <strong>${collector ? collector.name : '—'}</strong></div>
                    <div><span style="opacity:.7;">Date</span><br>
                         <strong>${formatDate(p.date)}</strong></div>
                    <div><span style="opacity:.7;">Montant payé</span><br>
                         <strong style="color:var(--md-sys-color-primary);">${formatCurrency(p.amount)}</strong></div>
                    <div><span style="opacity:.7;">Note</span><br>
                         <strong>${p.note || '—'}</strong></div>
                </div>
                <div style="font-size:12px;color:var(--md-sys-color-on-surface-variant);
                            margin-bottom:8px;font-weight:500;">
                    Signature du collecteur :
                </div>
                <div style="border:1px solid var(--md-sys-color-outline-variant);
                            border-radius:10px;background:#fff;padding:8px;text-align:center;">
                    <img src="${p.signatureData}" alt="Signature"
                         style="max-width:100%;max-height:140px;object-fit:contain;">
                </div>
                ${p.confirmedAt ? `<div style="font-size:11px;opacity:.6;margin-top:8px;text-align:right;">
                    Signé le ${new Date(p.confirmedAt).toLocaleString('fr-MG')}</div>` : ''}
            </div>
            <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="closeModal('${modalId}')">Fermer</button>
            </div>
        </div>`;
    openModal(modalId);
}

function updatePaiementsTable() {
    const tbody = document.getElementById('paiements-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const paiements = getPaiementsForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!paiements.length) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="empty-state">
                <div class="material-icons">payments</div>
                <div>Aucun paiement pour ${currentYear}</div>
            </td></tr>`;
        _sa('', null, 'paiements');   // ferme le panneau
        return;
    }

    paiements.forEach(p => {
        const collector = (appData.collectors || []).find(c => c.id === p.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        const sigBadge = p.signatureData
            ? `<span title="Paiement signé — cliquer pour voir la signature"
                     onclick="viewPaiementSignature(${p.id})"
                     style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;
                            padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;
                            background:rgba(46,125,50,.12);color:#2e7b32;border:1px solid rgba(46,125,50,.3);">
                 <span class="material-icons" style="font-size:13px;">verified</span>Signé
               </span>`
            : `<span title="Aucune signature enregistrée"
                     style="display:inline-flex;align-items:center;gap:3px;
                            padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;
                            background:rgba(198,40,40,.10);color:#c62828;border:1px solid rgba(198,40,40,.25);">
                 <span class="material-icons" style="font-size:13px;">warning_amber</span>Non signé
               </span>`;
        row.innerHTML = `
            <td data-label="Date">${formatDate(p.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant Payé">${formatCurrency(p.amount)}</td>
            <td data-label="Note">${RiseVanillaSearch.highlightText(p.note || '—', _q)}</td>
            <td data-label="Signature">${sigBadge}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-danger" onclick="deletePaiement(${p.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        // Avatar collecteur
        const collTdP = row.querySelector('td[data-label="Collecteur"]');
        if (collTdP) {
            if (collector) {
                collTdP.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
                const avatarCell = renderCollectorAvatar(collector, false);
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = RiseVanillaSearch.highlightText(collector.name, _q);
                avatarCell.appendChild(nameSpan);
                collTdP.appendChild(avatarCell);
            } else {
                collTdP.innerHTML = '<em style="opacity:.6">Supprimé</em>';
            }
        }
        tbody.appendChild(row);
    });

    // ── SearchAnalytics : agrégats paiements si recherche active ────────
    const _qP = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_qP) {
        const _enrichedP = paiements.map(p => {
            const c = (appData.collectors || []).find(col => col.id === p.collectorId);
            return Object.assign({}, p, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_qP, _enrichedP, 'paiements');
    } else {
        _sa('', null, 'paiements');
    }
}

// ── Live formatting pour champs montant ───────────────────────

function _initAdvanceAmountLiveFormat() {
    const el = document.getElementById('advance-amount');
    if (!el || el._advanceFormatBound) return;
    el._advanceFormatBound = true;
    el.addEventListener('input', function (e) {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) { e.target.value = ''; return; }
        e.target.value = Number(raw).toLocaleString('fr-MG');
    });
}

function _initRemboursementAmountLiveFormat() {
    const el = document.getElementById('remboursement-amount');
    if (!el || el._rembFormatBound) return;
    el._rembFormatBound = true;
    el.addEventListener('input', function (e) {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) { e.target.value = ''; return; }
        e.target.value = Number(raw).toLocaleString('fr-MG');
    });
}

// Initialiser les formatages une fois le DOM prêt
document.addEventListener('DOMContentLoaded', function () {
    _initAdvanceAmountLiveFormat();
    _initRemboursementAmountLiveFormat();

    // Écouter les changements de filtre collecteur
    const filterSelect = document.getElementById('advance-filter-collector');
    if (filterSelect) {
        filterSelect.addEventListener('change', updateAdvancesTable);
    }
});
